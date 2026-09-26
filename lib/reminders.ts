import { and, eq, inArray, lt, sql } from "drizzle-orm";
import {
  academicCalendarEvents,
  courses,
  notificationPreferences,
  pushSubscriptions,
  readingSessions,
  reminderLog,
  studentCourses,
  studyLogs,
} from "@/database/schema";
import { notifyMany, type NotifyInput } from "@/lib/notify";
import { sendPushEach, type PushPayload } from "@/lib/push";
import { computePlans, type Plan } from "@/lib/planner";
import { APP_TIME_ZONE, lagosDate, lagosHour } from "@/lib/time";
import { db } from "@/database/drizzle";

const EXAM_COUNTDOWN_DAYS = [7, 3, 1];
const DEFAULT_REMINDER_HOUR = 19;

/**
 * Claims (userId, key) pairs in the dedupe ledger and returns only the ones
 * this call won - so overlapping ticks or several worker instances never
 * send the same reminder twice.
 */
async function claim(pairs: { userId: string; key: string }[]) {
  if (pairs.length === 0) return new Set<string>();
  const won = await db
    .insert(reminderLog)
    .values(pairs)
    .onConflictDoNothing({ target: [reminderLog.userId, reminderLog.key] })
    .returning({ userId: reminderLog.userId, key: reminderLog.key });
  return new Set(won.map((w) => `${w.userId}|${w.key}`));
}

function inDays(n: number) {
  return n === 1 ? "tomorrow" : `in ${n} days`;
}

/**
 * Runs every few minutes. At each user's chosen reminder hour (Lagos time)
 * it sends exam countdowns (7/3/1 days out) and, if they haven't read
 * anything today, a study nudge. Only users with at least one push
 * subscription are considered - there's no one to nudge otherwise.
 */
export async function sendScheduledReminders() {
  const hour = lagosHour();
  const todayLagos = lagosDate();
  // reading_sessions.date is written as the UTC date (see
  // app/api/users/reading-session) - compare against the same thing.
  const todayUtc = new Date().toISOString().slice(0, 10);
  const yesterdayUtc = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const due = await db
    .selectDistinct({
      userId: pushSubscriptions.userId,
      studyReminders: sql<boolean>`coalesce(${notificationPreferences.studyReminders}, true)`,
      examReminders: sql<boolean>`coalesce(${notificationPreferences.examReminders}, true)`,
    })
    .from(pushSubscriptions)
    .leftJoin(notificationPreferences, eq(notificationPreferences.userId, pushSubscriptions.userId))
    .where(sql`coalesce(${notificationPreferences.reminderHour}, ${DEFAULT_REMINDER_HOUR}) = ${hour}`);

  if (due.length === 0) return;

  // ── Exam countdowns ──────────────────────────────────────────────────
  const examUserIds = due.filter((d) => d.examReminders).map((d) => d.userId);
  if (examUserIds.length > 0) {
    const daysOut = sql<number>`((${courses.examDate} at time zone ${APP_TIME_ZONE})::date - ${todayLagos}::date)`;
    const [courseExams, calendarExams] = await Promise.all([
      db
        .select({
          userId: studentCourses.userId,
          courseId: courses.id,
          courseCode: courses.courseCode,
          days: daysOut,
        })
        .from(studentCourses)
        .innerJoin(courses, eq(courses.id, studentCourses.courseId))
        .where(
          and(
            inArray(studentCourses.userId, examUserIds),
            sql`${daysOut} in (${sql.join(EXAM_COUNTDOWN_DAYS.map((d) => sql`${d}`), sql`, `)})`,
          ),
        ),
      db
        .select({
          id: academicCalendarEvents.id,
          activity: academicCalendarEvents.activity,
          days: sql<number>`(${academicCalendarEvents.startDate} - ${todayLagos}::date)`,
        })
        .from(academicCalendarEvents)
        .where(
          and(
            eq(academicCalendarEvents.category, "exam"),
            eq(academicCalendarEvents.isPublished, true),
            sql`(${academicCalendarEvents.startDate} - ${todayLagos}::date) in (${sql.join(EXAM_COUNTDOWN_DAYS.map((d) => sql`${d}`), sql`, `)})`,
          ),
        ),
    ]);

    const candidates: (NotifyInput & { key: string })[] = [
      ...courseExams.map((e) => ({
        key: `exam:${e.courseId}:${e.days}`,
        userId: e.userId,
        type: "SYSTEM" as const,
        category: "exam" as const,
        title: `${e.courseCode} exam ${inDays(e.days)}`,
        message: `Your ${e.courseCode} exam is ${inDays(e.days)}. A quick CBT practice now will show you what to revise.`,
        url: "/cbt",
        tag: `exam-${e.courseId}`,
      })),
      ...calendarExams.flatMap((ev) =>
        examUserIds.map((userId) => ({
          key: `calexam:${ev.id}:${ev.days}`,
          userId,
          type: "SYSTEM" as const,
          category: "exam" as const,
          title: `Exams start ${inDays(ev.days)}`,
          message: `${ev.activity} starts ${inDays(ev.days)}. Check your timetable and plan your revision.`,
          url: "/dashboard/calendar",
          tag: `calexam-${ev.id}`,
        })),
      ),
    ];

    const won = await claim(candidates.map(({ userId, key }) => ({ userId, key })));
    const toSend = candidates.filter((c) => won.has(`${c.userId}|${c.key}`));
    await notifyMany(toSend.map(({ key, ...input }) => input));
    if (toSend.length) console.log(`🔔 Sent ${toSend.length} exam reminder(s)`);
  }

  // ── Daily study nudge (push only - would just clutter the bell) ─────
  const studyUserIds = due.filter((d) => d.studyReminders).map((d) => d.userId);
  if (studyUserIds.length > 0) {
    const recent = await db
      .selectDistinct({ userId: readingSessions.userId, date: readingSessions.date })
      .from(readingSessions)
      .where(
        and(
          inArray(readingSessions.userId, studyUserIds),
          inArray(readingSessions.date, [todayUtc, yesterdayUtc]),
        ),
      );
    // Study logged by hand counts too (study_logs.date is the Lagos date)
    const yesterdayLagos = lagosDate(new Date(Date.now() - 86_400_000));
    const logged = await db
      .selectDistinct({ userId: studyLogs.userId, date: studyLogs.date })
      .from(studyLogs)
      .where(and(inArray(studyLogs.userId, studyUserIds), inArray(studyLogs.date, [todayLagos, yesterdayLagos])));

    const readToday = new Set([
      ...recent.filter((r) => r.date === todayUtc).map((r) => r.userId),
      ...logged.filter((l) => l.date === todayLagos).map((l) => l.userId),
    ]);
    const readYesterday = new Set([
      ...recent.filter((r) => r.date === yesterdayUtc).map((r) => r.userId),
      ...logged.filter((l) => l.date === yesterdayLagos).map((l) => l.userId),
    ]);

    const idle = studyUserIds.filter((id) => !readToday.has(id));
    const won = await claim(idle.map((userId) => ({ userId, key: `study:${todayLagos}` })));
    const claimed = idle.filter((id) => won.has(`${id}|study:${todayLagos}`));

    // Name today's focus course from the Semester Planner when there is one
    const plans = claimed.length ? await computePlans(claimed) : new Map();
    await sendPushEach(
      claimed.map((userId) => ({ userId, payload: studyNudge(plans.get(userId), readYesterday.has(userId)) })),
      "study",
    );
    if (claimed.length) console.log(`🔔 Sent ${claimed.length} study reminder(s)`);
  }
}

export function studyNudge(plan: Plan | undefined, studiedYesterday: boolean): PushPayload {
  const focus = plan?.focus;
  const course = focus ? plan!.courses.find((c) => c.courseId === focus.courseId) : undefined;
  if (focus && course) {
    const behind = course.plannedMinutes - course.doneMinutes;
    // Late in the week and well short: say so plainly
    if (plan!.daysLeftInWeek <= 3 && behind >= 120) {
      return {
        title: `${Math.round(behind / 60)}h behind on ${focus.courseCode} this week`,
        // Only promise "back on track" if today's slice can actually get there
        body: focus.minutes * plan!.daysLeftInWeek >= behind
          ? `${focus.minutes} minutes today gets you back on track.`
          : `Aim for ${focus.minutes} minutes today. If this week's plan is too much, lower your weekly goal on Progress.`,
        url: "/dashboard/progress",
        tag: "study-reminder",
      };
    }
    return {
      title: studiedYesterday ? `Keep your streak alive 🔥` : `Today: ${focus.courseCode} · ${focus.minutes} min`,
      body: studiedYesterday
        ? `${focus.minutes} minutes of ${focus.courseCode} keeps your streak and your plan on track.`
        : `That keeps you on plan this week. Studied offline? Log it so it counts.`,
      url: "/dashboard/progress",
      tag: "study-reminder",
    };
  }
  return studiedYesterday
    ? { title: "Keep your streak alive 🔥", body: "You studied yesterday. A few pages today keeps the streak going.", url: "/dashboard", tag: "study-reminder" }
    : { title: "Time for a quick study session", body: "Even 15 minutes adds up. Studied offline? Log it so your streak counts.", url: "/dashboard", tag: "study-reminder" };
}

/** Ledger rows only need to outlive the longest countdown window. */
export async function pruneReminderLog() {
  await db.delete(reminderLog).where(lt(reminderLog.createdAt, new Date(Date.now() - 30 * 86_400_000)));
}
