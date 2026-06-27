import { db } from "@/database/drizzle";
import { readingSessions, userBooks, users, studentCourses, courses, academicCalendarEvents } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const departmentId = user.departmentId;

    // 0. Fetch upcoming exam date from TWO sources and use the soonest:
    //    a) courses.examDate — set per-course by admin
    //    b) academic_calendar_events with category="exam" — set via the Calendar admin UI
    //    Run both in parallel.
    const today = format(new Date(), "yyyy-MM-dd");

    const [userCourses, calendarExams] = await Promise.all([
      // Source A: per-course exam dates for courses the student is enrolled in
      db
        .select({ examDate: courses.examDate })
        .from(studentCourses)
        .innerJoin(courses, eq(studentCourses.courseId, courses.id))
        .where(eq(studentCourses.userId, userId)),

      // Source B: academic calendar events with category "exam" that are published and upcoming
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

    // Collect all candidate exam dates (filter out nulls and past dates)
    const candidateDates: Date[] = [
      ...userCourses
        .filter(c => c.examDate)
        .map(c => new Date(c.examDate!)),
      ...calendarExams
        .map(e => new Date(e.startDate)),
    ]
      .filter(d => d >= new Date()) // only future/today
      .sort((a, b) => a.getTime() - b.getTime());

    const soonestExam = candidateDates[0] ?? null;

    const daysToExam = soonestExam
      ? Math.max(0, Math.ceil((soonestExam.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    // 1. KPIs
    // Total Books Read
    const booksReadRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBooks)
      .where(and(eq(userBooks.userId, userId), sql`${userBooks.readCount} > 0`));
    const totalBooksRead = Number(booksReadRes[0]?.count || 0);

    // Total Minutes Read
    const timeReadRes = await db
      .select({ totalMinutes: sql<number>`sum(${readingSessions.duration})` })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId));
    const totalMinutesRead = Number(timeReadRes[0]?.totalMinutes || 0);

    // AI Usage Tracking
    const aiUsageRes = await db
      .select({ totalAi: sql<number>`sum(${userBooks.aiRequests})` })
      .from(userBooks)
      .where(eq(userBooks.userId, userId));
    const totalAiRequests = Number(aiUsageRes[0]?.totalAi || 0);

    // Current Streak Calculation
    // Fetch distinct dates for user's reading sessions, ordered by date desc
    const sessions = await db
      .select({ date: readingSessions.date })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId))
      .orderBy(desc(readingSessions.date));

    // Dedup dates and sort desc
    // Use a string-based Set to deduplicate ISO date strings ("yyyy-MM-dd")
    const uniqueDateStrings = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();

    let streak = 0;
    // Use startOfDay to normalise "today" and "yesterday" to midnight local time,
    // avoiding UTC-vs-local timezone mismatches when parsing date-only strings.
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

    // Check if the most recent session was today or yesterday to start the streak
    if (uniqueDateStrings.length > 0) {
        const lastDateStr = uniqueDateStrings[0];
        if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
            streak = 1;
            let currentStr = lastDateStr;

            for (let i = 1; i < uniqueDateStrings.length; i++) {
                const prevStr = uniqueDateStrings[i];
                // The expected previous date is currentStr minus one day
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

    // 2. Heatmap Data (Last 365 days or all time)
    // Group by date, sum duration
    const heatmapData = await db
      .select({
        date: readingSessions.date,
        count: sql<number>`count(*)`, // or sum duration/pages
        value: sql<number>`sum(${readingSessions.duration})` // intensity based on duration
      })
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId))
      .groupBy(readingSessions.date);

    // 3. Weekly Trends (Last 7 days)
    const sevenDaysAgo = subDays(new Date(), 6);
    const last7DaysSessions = await db
      .select({
        date: readingSessions.date,
        minutes: readingSessions.duration
      })
      .from(readingSessions)
      .where(and(
        eq(readingSessions.userId, userId),
        gte(readingSessions.date, format(sevenDaysAgo, "yyyy-MM-dd"))
      ));

    // Aggregate by day for chart
    const trendsMap = new Map();
    const days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
    
    days.forEach(day => {
        trendsMap.set(format(day, "yyyy-MM-dd"), { user: 0, department: 0 });
    });

    last7DaysSessions.forEach(session => {
        const d = new Date(session.date); 
        const key = format(d, "yyyy-MM-dd");
        if (trendsMap.has(key)) {
            const current = trendsMap.get(key);
            trendsMap.set(key, { ...current, user: current.user + (session.minutes || 0) });
        }
    });

    // 4. Department Average Trends (Last 7 days)
    if (departmentId) {
      const deptSessions = await db
        .select({
          date: readingSessions.date,
          totalMinutes: sql<number>`sum(${readingSessions.duration})`,
          uniqueUsers: sql<number>`count(distinct ${readingSessions.userId})`,
        })
        .from(readingSessions)
        .innerJoin(users, eq(readingSessions.userId, users.id))
        .where(and(
          eq(users.departmentId, departmentId),
          gte(readingSessions.date, format(sevenDaysAgo, "yyyy-MM-dd"))
        ))
        .groupBy(readingSessions.date);

      // Inject averages into trendsMap
      deptSessions.forEach(s => {
          const d = new Date(s.date as string);
          const key = format(d, "yyyy-MM-dd");
          if (trendsMap.has(key)) {
              const current = trendsMap.get(key);
              const userCount = Number(s.uniqueUsers) || 1;
              const averageMins = Math.round(Number(s.totalMinutes) / userCount);
              trendsMap.set(key, { ...current, department: averageMins });
          }
      });
    }

    const weeklyTrends = Array.from(trendsMap.entries()).map(([date, data]) => ({
        date,
        minutes: data.user,
        departmentAverage: data.department,
        day: format(parseISO(date), "EEE") // Mon, Tue...
    }));


    return NextResponse.json({
        kpis: {
            booksRead: totalBooksRead,
            minutesRead: totalMinutesRead,
            streak,
            daysToExam,
            totalAiRequests,
        },
        heatmap: heatmapData.map(h => ({ 
          date: h.date, 
          count: h.count,
          value: h.value 
        })),
        weeklyTrends
    });

  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
