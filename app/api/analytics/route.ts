import { db } from "@/database/drizzle";
import { readingSessions, userBooks, users, studentCourses, courses, academicCalendarEvents } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { withCache } from "@/lib/redis";
import { NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";

// Analytics are cached per-user for 5 minutes (300 s).
// This means at 1 000 concurrent dashboard loads, the DB sees at most
// ~1 000 / 300 ≈ a trickle of unique queries instead of a storm.
const ANALYTICS_TTL = 300;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId     = user.id;
    const departmentId = user.departmentId;

    const cacheKey = `analytics:${userId}`;

    const payload = await withCache(cacheKey, ANALYTICS_TTL, async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      // ── 0. Exam date ──────────────────────────────────────────────────────
      // Run BOTH sources in parallel.
      const [userCourses, calendarExams] = await Promise.all([
        db
          .select({ examDate: courses.examDate })
          .from(studentCourses)
          .innerJoin(courses, eq(studentCourses.courseId, courses.id))
          .where(eq(studentCourses.userId, userId)),

        db
          .select({ startDate: academicCalendarEvents.startDate })
          .from(academicCalendarEvents)
          .where(
            and(
              eq(academicCalendarEvents.category, "exam"),
              eq(academicCalendarEvents.isPublished, true),
              gte(academicCalendarEvents.startDate, today),
            )
          )
          .orderBy(academicCalendarEvents.startDate)
          .limit(10),
      ]);

      const candidateDates: Date[] = [
        ...userCourses
          .filter(c => c.examDate)
          .map(c => new Date(c.examDate!)),
        ...calendarExams.map(e => new Date(e.startDate)),
      ]
        .filter(d => d >= new Date())
        .sort((a, b) => a.getTime() - b.getTime());

      const soonestExam = candidateDates[0] ?? null;
      const daysToExam = soonestExam
        ? Math.max(0, Math.ceil((soonestExam.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      // ── 1. KPIs — run all 3 counts in parallel ────────────────────────────
      const [booksReadRes, timeReadRes, aiUsageRes, sessions] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(userBooks)
          .where(and(eq(userBooks.userId, userId), sql`${userBooks.readCount} > 0`)),

        db
          .select({ totalMinutes: sql<number>`sum(${readingSessions.duration})` })
          .from(readingSessions)
          .where(eq(readingSessions.userId, userId)),

        db
          .select({ totalAi: sql<number>`sum(${userBooks.aiRequests})` })
          .from(userBooks)
          .where(eq(userBooks.userId, userId)),

        // All session dates for streak calculation (only need date column)
        db
          .select({ date: readingSessions.date })
          .from(readingSessions)
          .where(eq(readingSessions.userId, userId))
          .orderBy(desc(readingSessions.date)),
      ]);

      const totalBooksRead    = Number(booksReadRes[0]?.count || 0);
      const totalMinutesRead  = Number(timeReadRes[0]?.totalMinutes || 0);
      const totalAiRequests   = Number(aiUsageRes[0]?.totalAi || 0);

      // ── 2. Streak ─────────────────────────────────────────────────────────
      const uniqueDateStrings = Array.from(
        new Set(sessions.map(s => s.date))
      ).sort().reverse();

      let streak = 0;
      const todayStr     = format(new Date(), "yyyy-MM-dd");
      const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

      if (uniqueDateStrings.length > 0) {
        const lastDateStr = uniqueDateStrings[0];
        if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
          streak = 1;
          let currentStr = lastDateStr;
          for (let i = 1; i < uniqueDateStrings.length; i++) {
            const prevStr         = uniqueDateStrings[i];
            const expectedPrevStr = format(subDays(parseISO(currentStr), 1), "yyyy-MM-dd");
            if (prevStr === expectedPrevStr) {
              streak++;
              currentStr = prevStr;
            } else {
              break;
            }
          }
        }
      }

      // ── 3. Heatmap + Weekly trends — also in parallel ─────────────────────
      const sevenDaysAgo = subDays(new Date(), 6);

      const [heatmapData, last7DaysSessions, deptSessions] = await Promise.all([
        db
          .select({
            date:  readingSessions.date,
            count: sql<number>`count(*)`,
            value: sql<number>`sum(${readingSessions.duration})`,
          })
          .from(readingSessions)
          .where(eq(readingSessions.userId, userId))
          .groupBy(readingSessions.date),

        db
          .select({
            date:    readingSessions.date,
            minutes: readingSessions.duration,
          })
          .from(readingSessions)
          .where(and(
            eq(readingSessions.userId, userId),
            gte(readingSessions.date, format(sevenDaysAgo, "yyyy-MM-dd"))
          )),

        // Department averages (only if departmentId is known)
        departmentId
          ? db
              .select({
                date:         readingSessions.date,
                totalMinutes: sql<number>`sum(${readingSessions.duration})`,
                uniqueUsers:  sql<number>`count(distinct ${readingSessions.userId})`,
              })
              .from(readingSessions)
              .innerJoin(users, eq(readingSessions.userId, users.id))
              .where(and(
                eq(users.departmentId, departmentId),
                gte(readingSessions.date, format(sevenDaysAgo, "yyyy-MM-dd"))
              ))
              .groupBy(readingSessions.date)
          : Promise.resolve([]),
      ]);

      // ── 4. Assemble weekly trends ─────────────────────────────────────────
      const trendsMap = new Map<string, { user: number; department: number }>();
      eachDayOfInterval({ start: sevenDaysAgo, end: new Date() }).forEach(day => {
        trendsMap.set(format(day, "yyyy-MM-dd"), { user: 0, department: 0 });
      });

      last7DaysSessions.forEach(session => {
        const key = format(new Date(session.date), "yyyy-MM-dd");
        if (trendsMap.has(key)) {
          const current = trendsMap.get(key)!;
          trendsMap.set(key, { ...current, user: current.user + (session.minutes || 0) });
        }
      });

      deptSessions.forEach((s: any) => {
        const key = format(new Date(s.date as string), "yyyy-MM-dd");
        if (trendsMap.has(key)) {
          const current   = trendsMap.get(key)!;
          const userCount = Number(s.uniqueUsers) || 1;
          trendsMap.set(key, { ...current, department: Math.round(Number(s.totalMinutes) / userCount) });
        }
      });

      const weeklyTrends = Array.from(trendsMap.entries()).map(([date, data]) => ({
        date,
        minutes:           data.user,
        departmentAverage: data.department,
        day:               format(parseISO(date), "EEE"),
      }));

      return {
        kpis: {
          booksRead:      totalBooksRead,
          minutesRead:    totalMinutesRead,
          streak,
          daysToExam,
          totalAiRequests,
        },
        heatmap: heatmapData.map(h => ({
          date:  h.date,
          count: h.count,
          value: h.value,
        })),
        weeklyTrends,
      };
    });

    return NextResponse.json(payload);

  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
