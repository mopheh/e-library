import { db } from "@/database/drizzle";
import { bookCourses, courses, readingSessions, studentCourses, studyLogs } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { invalidateCache } from "@/lib/redis";
import { invalidatePlan } from "@/lib/planner";
import { lagosDate } from "@/lib/time";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const DAY_MS = 86_400_000;
// How far back a student may log - long enough to catch up after a busy
// week, short enough that the log stays an honest record.
const MAX_BACKDATE_DAYS = 7;
const MAX_LOGS_PER_DAY = 30;
const HISTORY_DAYS = 30;

const logSchema = z.object({
  courseId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timesRead: z.number().int().min(1).max(10),
  minutes: z.number().int().min(5).max(720).nullable().optional(),
  method: z.enum(["TEXTBOOK", "NOTES", "PAST_QUESTIONS", "GROUP", "OTHER"]),
  note: z.string().trim().max(280).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const weekStart = lagosDate(new Date(Date.now() - 6 * DAY_MS));
    const historyStart = lagosDate(new Date(Date.now() - (HISTORY_DAYS - 1) * DAY_MS));

    const [logs, enrolled, appByCourse] = await Promise.all([
      db
        .select({
          id: studyLogs.id,
          courseId: studyLogs.courseId,
          courseCode: courses.courseCode,
          courseTitle: courses.title,
          date: studyLogs.date,
          timesRead: studyLogs.timesRead,
          minutes: studyLogs.minutes,
          method: studyLogs.method,
          note: studyLogs.note,
          createdAt: studyLogs.createdAt,
        })
        .from(studyLogs)
        .innerJoin(courses, eq(courses.id, studyLogs.courseId))
        .where(and(eq(studyLogs.userId, user.id), gte(studyLogs.date, historyStart)))
        .orderBy(desc(studyLogs.date), desc(studyLogs.createdAt))
        .limit(200),

      db
        .select({ courseId: courses.id, courseCode: courses.courseCode, title: courses.title })
        .from(studentCourses)
        .innerJoin(courses, eq(courses.id, studentCourses.courseId))
        .where(eq(studentCourses.userId, user.id)),

      // In-app reading this week, attributed to courses via the book's
      // course links - so each course shows one combined picture.
      db
        .select({
          courseId: bookCourses.courseId,
          minutes: sql<number>`coalesce(sum(${readingSessions.duration}), 0)`,
          lastDate: sql<string>`max(${readingSessions.date})`,
        })
        .from(readingSessions)
        .innerJoin(bookCourses, eq(bookCourses.bookId, readingSessions.bookId))
        .where(and(eq(readingSessions.userId, user.id), gte(readingSessions.date, weekStart)))
        .groupBy(bookCourses.courseId),
    ]);

    // Per-course weekly summary: every enrolled course (so untouched ones
    // are visible too) plus any other course the student logged.
    const summary = new Map<string, {
      courseId: string; courseCode: string; title: string;
      manualTimes: number; manualMinutes: number; appMinutes: number; lastStudied: string | null;
    }>();
    const ensure = (courseId: string, courseCode: string, title: string) => {
      if (!summary.has(courseId)) {
        summary.set(courseId, { courseId, courseCode, title, manualTimes: 0, manualMinutes: 0, appMinutes: 0, lastStudied: null });
      }
      return summary.get(courseId)!;
    };
    const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

    enrolled.forEach((c) => ensure(c.courseId, c.courseCode, c.title));
    logs
      .filter((l) => l.date >= weekStart)
      .forEach((l) => {
        const s = ensure(l.courseId, l.courseCode, l.courseTitle);
        s.manualTimes += l.timesRead;
        s.manualMinutes += l.minutes ?? 0;
        s.lastStudied = later(s.lastStudied, l.date);
      });
    appByCourse.forEach((a) => {
      const s = summary.get(a.courseId);
      if (!s) return; // reading attributed to a course the student doesn't take
      s.appMinutes += Number(a.minutes);
      s.lastStudied = later(s.lastStudied, a.lastDate);
    });

    const weekly = [...summary.values()].sort(
      (a, b) =>
        b.manualMinutes + b.appMinutes - (a.manualMinutes + a.appMinutes) ||
        b.manualTimes - a.manualTimes ||
        a.courseCode.localeCompare(b.courseCode),
    );

    return NextResponse.json({ logs, weekly, today: lagosDate() });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error fetching study logs:", error);
    return NextResponse.json({ error: "Failed to load study log" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = logSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
    }
    const { courseId, date, timesRead, minutes, method, note } = parsed.data;

    const today = lagosDate();
    const earliest = lagosDate(new Date(Date.now() - MAX_BACKDATE_DAYS * DAY_MS));
    if (date > today || date < earliest) {
      return NextResponse.json(
        { error: `You can log study from the last ${MAX_BACKDATE_DAYS} days only.` },
        { status: 400 },
      );
    }

    const [[course], [{ recent }]] = await Promise.all([
      db.select({ id: courses.id, courseCode: courses.courseCode }).from(courses).where(eq(courses.id, courseId)).limit(1),
      db
        .select({ recent: sql<number>`count(*)` })
        .from(studyLogs)
        .where(and(eq(studyLogs.userId, user.id), gte(studyLogs.createdAt, new Date(Date.now() - DAY_MS)))),
    ]);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    if (Number(recent) >= MAX_LOGS_PER_DAY) {
      return NextResponse.json({ error: "That's a lot of logging for one day. Try again tomorrow." }, { status: 429 });
    }

    const [log] = await db
      .insert(studyLogs)
      .values({ userId: user.id, courseId, date, timesRead, minutes: minutes ?? null, method, note: note || null })
      .returning();

    await Promise.all([invalidateCache(`analytics:${user.id}`), invalidatePlan(user.id)]);

    return NextResponse.json({ log: { ...log, courseCode: course.courseCode } }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error creating study log:", error);
    return NextResponse.json({ error: "Couldn't save your log. Please try again." }, { status: 500 });
  }
}
