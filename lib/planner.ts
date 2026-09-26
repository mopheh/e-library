import { and, desc, eq, gte, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  academicCalendarEvents,
  academicProfiles,
  bookCourses,
  books,
  courses,
  questions,
  readingSessions,
  sessions as cbtSessions,
  studentCourses,
  studyLogs,
  userBooks,
} from "@/database/schema";
import { lagosDate } from "@/lib/time";
import { invalidateCache, withCache } from "@/lib/redis";

// ── Semester Planner + Course Readiness ────────────────────────────────────
// A weekly study budget is shared across the semester's registered courses,
// weighted by unit load, how close each exam is and how weak the student is
// in it (CBT accuracy). Readiness (0-100) blends three things we can
// actually measure, so it can always be explained:
//   effort    - study time in the last 14 days vs. what the plan asked for
//   practice  - average of the last 3 CBT scores for the course
//   coverage  - average progress through the course's approved materials
// Parts with no possible data (no CBT bank, no materials) drop out and the
// others are re-weighted, so a course is never penalised for what we lack.

export const DEFAULT_WEEKLY_MINUTES = 10 * 60;
export const MIN_WEEKLY_MINUTES = 2 * 60;
export const MAX_WEEKLY_MINUTES = 40 * 60;
// A logged sitting with no time entered still counts as some study
export const MINUTES_PER_UNTIMED_SITTING = 30;

const WEIGHTS = { effort: 0.4, practice: 0.35, coverage: 0.25 };
const EFFORT_WINDOW_DAYS = 14;
const DAY_MS = 86_400_000;

export type Semester = "FIRST" | "SECOND";
export type ReadinessBand = "ON_TRACK" | "GETTING_THERE" | "NEEDS_ATTENTION";

export interface PlanCourseInput {
  courseId: string;
  courseCode: string;
  title: string;
  units: number;
  examDate: string | null; // yyyy-mm-dd (Lagos)
  // minutes per Lagos date (in-app reading + logged study, merged)
  minutesByDate: Record<string, number>;
  cbtScores: number[]; // newest first, 0-100
  hasQuestionBank: boolean;
  materials: number; // approved materials linked to the course
  materialProgress: number[]; // 0-100 for each material the student opened
}

export interface PlanCourse {
  courseId: string;
  courseCode: string;
  title: string;
  units: number;
  examDate: string | null;
  daysToExam: number | null;
  plannedMinutes: number;
  doneMinutes: number;
  todayMinutes: number;
  readiness: number;
  band: ReadinessBand;
  parts: {
    effort: { score: number; studied: number; target: number };
    practice: { score: number | null; attempts: number; available: boolean };
    coverage: { score: number | null; opened: number; materials: number };
  };
  nextStep: { kind: "practice" | "read" | "study" | "keep"; label: string };
}

export interface Plan {
  semester: Semester;
  semesterChosen: boolean;
  weeklyMinutes: number;
  weekStart: string;
  today: string;
  daysLeftInWeek: number;
  planned: number;
  done: number;
  courses: PlanCourse[];
  focus: { courseId: string; courseCode: string; minutes: number } | null;
  nextExam: { courseCode: string; days: number } | null;
}

// ── dates (all Lagos) ─────────────────────────────────────────────────────
function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}
function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS);
}
/** Monday of the week containing `date`. */
export function weekStartOf(date: string) {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dow + 6) % 7));
}

function roundTo15(n: number) {
  return Math.max(0, Math.round(n / 15) * 15);
}

function urgency(daysToExam: number | null) {
  if (daysToExam == null || daysToExam < 0) return 1;
  if (daysToExam <= 7) return 2;
  if (daysToExam <= 14) return 1.5;
  if (daysToExam <= 30) return 1.2;
  return 1;
}

export function bandFor(readiness: number): ReadinessBand {
  if (readiness >= 75) return "ON_TRACK";
  if (readiness >= 50) return "GETTING_THERE";
  return "NEEDS_ATTENTION";
}

/** Pure: everything is derived from the inputs, so it's unit-testable. */
export function buildPlan(opts: {
  semester: Semester;
  semesterChosen: boolean;
  weeklyMinutes: number;
  today: string;
  courses: PlanCourseInput[];
}): Plan {
  const { today, weeklyMinutes } = opts;
  const weekStart = weekStartOf(today);
  const daysLeftInWeek = 7 - daysBetween(weekStart, today); // incl. today
  const effortFrom = addDays(today, -(EFFORT_WINDOW_DAYS - 1));

  const pre = opts.courses.map((c) => {
    const daysToExam = c.examDate ? daysBetween(today, c.examDate) : null;
    const recent = c.cbtScores.slice(0, 3);
    const practice = recent.length ? recent.reduce((s, x) => s + x, 0) / recent.length / 100 : null;
    // Weaker courses get more time; unknown sits in the middle
    const weakness = practice == null ? 1.25 : 1.5 - practice / 2;
    const weight = Math.max(1, c.units) * urgency(daysToExam) * weakness;
    return { c, daysToExam, practice, weight };
  });

  const totalWeight = pre.reduce((s, p) => s + p.weight, 0) || 1;

  const planCourses: PlanCourse[] = pre.map(({ c, daysToExam, practice, weight }) => {
    const plannedMinutes = Math.max(30, roundTo15((weeklyMinutes * weight) / totalWeight));
    let doneMinutes = 0;
    let studied = 0;
    for (const [date, mins] of Object.entries(c.minutesByDate)) {
      if (date >= weekStart && date <= today) doneMinutes += mins;
      if (date >= effortFrom && date <= today) studied += mins;
    }

    // Effort: two weeks of this course's planned time
    const target = plannedMinutes * 2;
    const effort = Math.min(1, studied / target);
    const coverage = c.materials > 0
      ? Math.min(1, c.materialProgress.reduce((s, p) => s + Math.min(100, p), 0) / 100 / c.materials)
      : null;
    const practiceAvailable = c.hasQuestionBank || c.cbtScores.length > 0;
    // Available-but-untried practice counts as 0; unavailable drops out
    const practiceScore = practiceAvailable ? (practice ?? 0) : null;

    let wSum = WEIGHTS.effort;
    let score = WEIGHTS.effort * effort;
    if (practiceScore != null) { wSum += WEIGHTS.practice; score += WEIGHTS.practice * practiceScore; }
    if (coverage != null) { wSum += WEIGHTS.coverage; score += WEIGHTS.coverage * coverage; }
    const readiness = Math.round((score / wSum) * 100);

    const remaining = Math.max(0, plannedMinutes - doneMinutes);
    const todayMinutes = remaining ? Math.min(120, Math.max(15, roundTo15(remaining / daysLeftInWeek))) : 0;

    let nextStep: PlanCourse["nextStep"];
    if (practiceAvailable && c.cbtScores.length === 0) nextStep = { kind: "practice", label: "Take your first practice CBT" };
    else if (coverage != null && coverage < 0.3) nextStep = { kind: "read", label: "Work through the course materials" };
    else if (practiceScore != null && practiceScore < 0.5) nextStep = { kind: "practice", label: "Retake a CBT to lift your score" };
    else if (remaining > 0) nextStep = { kind: "study", label: `Study ${todayMinutes} min today` };
    else nextStep = { kind: "keep", label: "On plan this week. Keep it up" };

    return {
      courseId: c.courseId,
      courseCode: c.courseCode,
      title: c.title,
      units: c.units,
      examDate: c.examDate,
      daysToExam,
      plannedMinutes,
      doneMinutes,
      todayMinutes,
      readiness,
      band: bandFor(readiness),
      parts: {
        effort: { score: effort, studied, target },
        practice: { score: practiceScore, attempts: c.cbtScores.length, available: practiceAvailable },
        coverage: { score: coverage, opened: c.materialProgress.length, materials: c.materials },
      },
      nextStep,
      _weight: weight,
    } as PlanCourse & { _weight: number };
  });

  // Today's focus: most minutes still owed this week, nudged by exam urgency
  const focusCourse = [...planCourses]
    .filter((c) => c.plannedMinutes > c.doneMinutes)
    .sort((a, b) =>
      (b.plannedMinutes - b.doneMinutes) * urgency(b.daysToExam) - (a.plannedMinutes - a.doneMinutes) * urgency(a.daysToExam),
    )[0];

  const upcoming = planCourses
    .filter((c) => c.daysToExam != null && c.daysToExam >= 0)
    .sort((a, b) => a.daysToExam! - b.daysToExam!)[0];

  const clean = planCourses.map(({ _weight, ...c }: PlanCourse & { _weight?: number }) => c);
  // Most urgent first: nearest exam, then least ready
  clean.sort((a, b) => (a.daysToExam ?? 9999) - (b.daysToExam ?? 9999) || a.readiness - b.readiness);

  return {
    semester: opts.semester,
    semesterChosen: opts.semesterChosen,
    weeklyMinutes,
    weekStart,
    today,
    daysLeftInWeek,
    planned: clean.reduce((s, c) => s + c.plannedMinutes, 0),
    done: clean.reduce((s, c) => s + Math.min(c.doneMinutes, c.plannedMinutes), 0),
    courses: clean,
    focus: focusCourse ? { courseId: focusCourse.courseId, courseCode: focusCourse.courseCode, minutes: focusCourse.todayMinutes } : null,
    nextExam: upcoming ? { courseCode: upcoming.courseCode, days: upcoming.daysToExam! } : null,
  };
}

function guessSemester(today: string, calendarSemester: string | null): Semester {
  if (calendarSemester === "FIRST" || calendarSemester === "SECOND") return calendarSemester;
  // UNIBEN's first semester usually runs Oct-Mar
  const month = Number(today.slice(5, 7));
  return month >= 10 || month <= 3 ? "FIRST" : "SECOND";
}

/**
 * Plans for many students at once in a fixed number of queries (not per
 * student), so the weekly reminder job can run it for everyone who's due.
 */
export async function computePlans(userIds: string[], now = new Date()): Promise<Map<string, Plan>> {
  const result = new Map<string, Plan>();
  if (userIds.length === 0) return result;

  const today = lagosDate(now);
  const since = addDays(today, -(EFFORT_WINDOW_DAYS + 7)); // covers this week + effort window

  const [profiles, enrolled, [calendar]] = await Promise.all([
    db.select().from(academicProfiles).where(inArray(academicProfiles.userId, userIds)),
    db
      .select({
        userId: studentCourses.userId,
        courseId: courses.id,
        courseCode: courses.courseCode,
        title: courses.title,
        units: courses.unitLoad,
        semester: courses.semester,
        examDate: sql<string | null>`to_char(${courses.examDate} at time zone 'Africa/Lagos', 'YYYY-MM-DD')`,
      })
      .from(studentCourses)
      .innerJoin(courses, eq(courses.id, studentCourses.courseId))
      .where(inArray(studentCourses.userId, userIds)),
    // Latest published calendar event that names a semester and has started
    db
      .select({ semester: academicCalendarEvents.semester })
      .from(academicCalendarEvents)
      .where(and(
        eq(academicCalendarEvents.isPublished, true),
        isNotNull(academicCalendarEvents.semester),
        lte(academicCalendarEvents.startDate, today),
      ))
      .orderBy(desc(academicCalendarEvents.startDate))
      .limit(1),
  ]);

  const profileByUser = new Map(profiles.map((p) => [p.userId, p]));
  const courseIds = [...new Set(enrolled.map((e) => e.courseId))];
  if (courseIds.length === 0) {
    for (const userId of userIds) {
      const p = profileByUser.get(userId);
      result.set(userId, buildPlan({
        semester: p?.planSemester ?? guessSemester(today, calendar?.semester ?? null),
        semesterChosen: Boolean(p?.planSemester),
        weeklyMinutes: p?.weeklyStudyMinutes ?? DEFAULT_WEEKLY_MINUTES,
        today,
        courses: [],
      }));
    }
    return result;
  }

  const rankedCbt = db
    .select({
      userId: cbtSessions.userId,
      courseId: cbtSessions.courseId,
      score: cbtSessions.score,
      completedAt: cbtSessions.completedAt,
      rn: sql<number>`row_number() over (partition by ${cbtSessions.userId}, ${cbtSessions.courseId} order by ${cbtSessions.completedAt} desc)`.as("rn"),
    })
    .from(cbtSessions)
    .where(and(
      inArray(cbtSessions.userId, userIds),
      inArray(cbtSessions.courseId, courseIds),
      isNotNull(cbtSessions.completedAt),
      isNotNull(cbtSessions.score),
    ))
    .as("ranked");

  const [appMinutes, manualMinutes, cbt, banks, materials, progress] = await Promise.all([
    // In-app reading, attributed to a course via the book's course links
    db
      .select({
        userId: readingSessions.userId,
        courseId: bookCourses.courseId,
        date: readingSessions.date,
        minutes: sql<number>`sum(${readingSessions.duration})`,
      })
      .from(readingSessions)
      .innerJoin(bookCourses, eq(bookCourses.bookId, readingSessions.bookId))
      .where(and(inArray(readingSessions.userId, userIds), inArray(bookCourses.courseId, courseIds), gte(readingSessions.date, since)))
      .groupBy(readingSessions.userId, bookCourses.courseId, readingSessions.date),
    db
      .select({
        userId: studyLogs.userId,
        courseId: studyLogs.courseId,
        date: studyLogs.date,
        minutes: sql<number>`sum(coalesce(${studyLogs.minutes}, ${studyLogs.timesRead} * ${MINUTES_PER_UNTIMED_SITTING}))`,
      })
      .from(studyLogs)
      .where(and(inArray(studyLogs.userId, userIds), inArray(studyLogs.courseId, courseIds), gte(studyLogs.date, since)))
      .groupBy(studyLogs.userId, studyLogs.courseId, studyLogs.date),
    // Last 3 completed CBTs per student+course (newest first)
    db
      .select({ userId: rankedCbt.userId, courseId: rankedCbt.courseId, score: rankedCbt.score })
      .from(rankedCbt)
      .where(sql`${rankedCbt.rn} <= 3`)
      .orderBy(desc(rankedCbt.completedAt)),
    db
      .selectDistinct({ courseId: questions.courseId })
      .from(questions)
      .where(inArray(questions.courseId, courseIds)),
    db
      .select({ courseId: bookCourses.courseId, bookId: bookCourses.bookId })
      .from(bookCourses)
      .innerJoin(books, eq(books.id, bookCourses.bookId))
      .where(and(inArray(bookCourses.courseId, courseIds), eq(books.reviewStatus, "APPROVED"))),
    db
      .select({ userId: userBooks.userId, bookId: userBooks.bookId, progress: userBooks.progress, readCount: userBooks.readCount })
      .from(userBooks)
      .innerJoin(bookCourses, eq(bookCourses.bookId, userBooks.bookId))
      .where(and(inArray(userBooks.userId, userIds), inArray(bookCourses.courseId, courseIds))),
  ]);

  const key = (u: string, c: string) => `${u}|${c}`;
  const minutes = new Map<string, Record<string, number>>();
  for (const row of [...appMinutes, ...manualMinutes]) {
    const k = key(row.userId, row.courseId);
    const m = minutes.get(k) ?? {};
    m[row.date] = (m[row.date] ?? 0) + Number(row.minutes || 0);
    minutes.set(k, m);
  }
  const scores = new Map<string, number[]>();
  for (const row of cbt) {
    if (!row.userId || !row.courseId || row.score == null) continue;
    const k = key(row.userId, row.courseId);
    scores.set(k, [...(scores.get(k) ?? []), row.score]);
  }
  const hasBank = new Set(banks.map((b) => b.courseId));
  const booksByCourse = new Map<string, Set<string>>();
  for (const m of materials) {
    booksByCourse.set(m.courseId, (booksByCourse.get(m.courseId) ?? new Set()).add(m.bookId));
  }
  const progressByUserBook = new Map<string, number>();
  for (const p of progress) {
    if (p.readCount > 0 || p.progress > 0) progressByUserBook.set(key(p.userId, p.bookId), p.progress);
  }

  for (const userId of userIds) {
    const p = profileByUser.get(userId);
    const mine = enrolled.filter((e) => e.userId === userId);
    const semestersRegistered = new Set(mine.map((e) => e.semester ?? "FIRST"));
    const semester: Semester = p?.planSemester
      ?? (semestersRegistered.size === 1 ? ([...semestersRegistered][0] as Semester) : guessSemester(today, calendar?.semester ?? null));

    const planInputs: PlanCourseInput[] = mine
      .filter((e) => (e.semester ?? "FIRST") === semester)
      .map((e) => {
        const bookIds = [...(booksByCourse.get(e.courseId) ?? [])];
        return {
          courseId: e.courseId,
          courseCode: e.courseCode,
          title: e.title,
          units: e.units,
          examDate: e.examDate,
          minutesByDate: minutes.get(key(userId, e.courseId)) ?? {},
          cbtScores: scores.get(key(userId, e.courseId)) ?? [],
          hasQuestionBank: hasBank.has(e.courseId),
          materials: bookIds.length,
          materialProgress: bookIds
            .map((b) => progressByUserBook.get(key(userId, b)))
            .filter((x): x is number => x !== undefined),
        };
      });

    result.set(userId, buildPlan({
      semester,
      semesterChosen: Boolean(p?.planSemester),
      weeklyMinutes: p?.weeklyStudyMinutes ?? DEFAULT_WEEKLY_MINUTES,
      today,
      courses: planInputs,
    }));
  }
  return result;
}

export async function computePlan(userId: string) {
  return (await computePlans([userId])).get(userId)!;
}

// ~10 queries per plan and it's on the dashboard + Progress page, so cache
// it for the same minute the client already treats it as fresh. Anything
// that changes a plan's inputs calls invalidatePlan().
const PLAN_TTL_SECS = 60;
export const planCacheKey = (userId: string) => `plan:${userId}`;

export function getCachedPlan(userId: string) {
  return withCache(planCacheKey(userId), PLAN_TTL_SECS, () => computePlan(userId));
}

export function invalidatePlan(userId: string) {
  return invalidateCache(planCacheKey(userId));
}
