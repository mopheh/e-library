import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/database/drizzle";
import {
  books,
  courses,
  departments,
  faculty,
  readingSessions,
  sessions as cbtSessions,
  studyLogs,
  userBooks,
  users,
} from "@/database/schema";
import { loadGrades } from "@/lib/grades";
import { manualStudyByDate } from "@/lib/study-logs";
import { lagosDate } from "@/lib/time";

type UserRow = typeof users.$inferSelect;

function shiftDate(day: string, days: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive study days ending today or yesterday (Lagos time), counting
 * both in-app reading and logged study. Same rule as the dashboard streak.
 */
export function studyStreak(dates: string[], today = lagosDate()): number {
  const set = new Set(dates);
  let day = set.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (set.has(day)) {
    streak++;
    day = shiftDate(day, -1);
  }
  return streak;
}

export type TimelineItem =
  | { kind: "READ"; at: string; title: string; minutes: number; pages: number }
  | { kind: "LOGGED"; at: string; title: string; minutes: number | null; timesRead: number; method: string }
  | { kind: "CBT"; at: string; title: string; score: number | null };

const TIMELINE_LIMIT = 20;

async function loadTimeline(userId: string): Promise<TimelineItem[]> {
  const [reading, logged, cbt] = await Promise.all([
    db
      .select({
        at: sql<string>`coalesce(${readingSessions.updatedAt}, ${readingSessions.createdAt})`,
        date: readingSessions.date,
        title: books.title,
        minutes: readingSessions.duration,
        pages: readingSessions.pagesRead,
      })
      .from(readingSessions)
      .innerJoin(books, eq(books.id, readingSessions.bookId))
      .where(eq(readingSessions.userId, userId))
      .orderBy(desc(sql`coalesce(${readingSessions.updatedAt}, ${readingSessions.createdAt})`))
      .limit(TIMELINE_LIMIT),
    db
      .select({
        at: studyLogs.createdAt,
        date: studyLogs.date,
        code: courses.courseCode,
        minutes: studyLogs.minutes,
        timesRead: studyLogs.timesRead,
        method: studyLogs.method,
      })
      .from(studyLogs)
      .innerJoin(courses, eq(courses.id, studyLogs.courseId))
      .where(eq(studyLogs.userId, userId))
      .orderBy(desc(studyLogs.createdAt))
      .limit(TIMELINE_LIMIT),
    db
      .select({ at: cbtSessions.completedAt, code: courses.courseCode, score: cbtSessions.score })
      .from(cbtSessions)
      .innerJoin(courses, eq(courses.id, cbtSessions.courseId))
      .where(and(eq(cbtSessions.userId, userId), isNotNull(cbtSessions.completedAt)))
      .orderBy(desc(cbtSessions.completedAt))
      .limit(TIMELINE_LIMIT),
  ]);

  const iso = (v: string | Date | null) => (v ? new Date(v).toISOString() : new Date(0).toISOString());
  const items: TimelineItem[] = [
    ...reading.map((r) => ({
      kind: "READ" as const,
      // One row per book per day; its timestamp is the last minute read that day.
      at: r.at && r.date === lagosDate(new Date(r.at)) ? iso(r.at) : `${r.date}T12:00:00.000Z`,
      title: r.title,
      minutes: r.minutes,
      pages: r.pages,
    })),
    ...logged.map((l) => ({
      kind: "LOGGED" as const,
      // A log can be back-dated; show it on the day the study happened.
      at: l.at && l.date === lagosDate(new Date(l.at)) ? iso(l.at) : `${l.date}T12:00:00.000Z`,
      title: l.code,
      minutes: l.minutes,
      timesRead: l.timesRead,
      method: l.method,
    })),
    ...cbt.map((c) => ({ kind: "CBT" as const, at: iso(c.at), title: c.code, score: c.score })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, TIMELINE_LIMIT);
}

async function loadClerkIdentity(clerkId: string) {
  try {
    const client = await clerkClient();
    const u = await client.users.getUser(clerkId);
    const primary = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId) ?? u.emailAddresses[0];
    return {
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      email: primary?.emailAddress ?? null,
      avatarUrl: u.hasImage ? u.imageUrl : null,
    };
  } catch (err) {
    // Clerk down shouldn't take the profile page with it - fall back to the DB copy.
    console.error("Profile: Clerk lookup failed", err);
    return null;
  }
}

/** Everything the profile page shows, computed with the same rules as the dashboard. */
export async function loadProfile(user: UserRow) {
  const today = lagosDate();
  const weekStart = shiftDate(today, -6); // last 7 days including today

  const [clerk, [place], [library], [app], appDays, manual, grades, recentCbt, timeline] = await Promise.all([
    loadClerkIdentity(user.clerkId),
    db
      .select({ facultyName: faculty.name, departmentName: departments.name })
      .from(departments)
      .innerJoin(faculty, eq(faculty.id, departments.facultyId))
      .where(eq(departments.id, user.departmentId))
      .limit(1),
    db
      .select({
        booksRead: sql<number>`count(*) filter (where ${userBooks.readCount} > 0)`,
        downloads: sql<number>`coalesce(sum(${userBooks.downloadCount}), 0)`,
        aiRequests: sql<number>`coalesce(sum(${userBooks.aiRequests}), 0)`,
      })
      .from(userBooks)
      .where(eq(userBooks.userId, user.id)),
    db
      .select({
        minutes: sql<number>`coalesce(sum(${readingSessions.duration}), 0)`,
        pages: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)`,
        weekMinutes: sql<number>`coalesce(sum(${readingSessions.duration}) filter (where ${readingSessions.date} >= ${weekStart}), 0)`,
      })
      .from(readingSessions)
      .where(eq(readingSessions.userId, user.id)),
    db
      .selectDistinct({ date: readingSessions.date })
      .from(readingSessions)
      .where(and(eq(readingSessions.userId, user.id), gte(readingSessions.date, shiftDate(today, -400)))),
    manualStudyByDate(user.id),
    loadGrades(user.id),
    db
      .select({ score: cbtSessions.score })
      .from(cbtSessions)
      .where(and(eq(cbtSessions.userId, user.id), isNotNull(cbtSessions.completedAt), isNotNull(cbtSessions.score)))
      .orderBy(desc(cbtSessions.completedAt))
      .limit(5),
    loadTimeline(user.id),
  ]);

  const manualMinutes = manual.reduce((s, d) => s + Number(d.minutes || 0), 0);
  const manualWeek = manual.filter((d) => d.date >= weekStart).reduce((s, d) => s + Number(d.minutes || 0), 0);
  const scores = recentCbt.map((c) => c.score!).filter((s) => s != null);

  // users.fullName is what the rest of the app shows, so it's the source of
  // truth for the name. Clerk's first/last split seeds the edit form only
  // when it agrees with it - otherwise saving any field would rename them.
  const clerkName = [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ").trim();
  const [splitFirst, ...splitRest] = user.fullName.trim().split(/\s+/);
  const useClerkSplit = !!clerk && clerkName === user.fullName.trim();

  return {
    id: user.id,
    fullName: user.fullName,
    firstName: (useClerkSplit ? clerk?.firstName : splitFirst) ?? "",
    lastName: (useClerkSplit ? clerk?.lastName : splitRest.join(" ")) ?? "",
    email: clerk?.email ?? user.email,
    avatarUrl: clerk?.avatarUrl ?? null,
    role: user.role ?? "STUDENT",
    memberSince: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    personal: {
      phoneNumber: user.phoneNumber ?? "",
      gender: user.gender,
      dateOfBirth: user.dateOfBirth ?? "",
      address: user.address ?? "",
    },
    academic: {
      matricNo: user.matricNo,
      level: user.year,
      facultyId: user.facultyId,
      facultyName: place?.facultyName ?? null,
      departmentId: user.departmentId,
      departmentName: place?.departmentName ?? null,
    },
    stats: {
      cgpa: grades.summary.cgpa,
      degreeClass: grades.summary.degreeClass,
      totalUnits: grades.summary.totalUnits,
      streak: studyStreak([...appDays.map((d) => d.date), ...manual.map((d) => d.date)], today),
      weekMinutes: Number(app?.weekMinutes ?? 0) + manualWeek,
      totalMinutes: Number(app?.minutes ?? 0) + manualMinutes,
      cbtAvg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      cbtAttempts: scores.length,
      booksRead: Number(library?.booksRead ?? 0),
      pagesRead: Number(app?.pages ?? 0),
      downloads: Number(library?.downloads ?? 0),
      aiRequests: Number(library?.aiRequests ?? 0),
    },
    timeline,
  };
}

export type ProfilePayload = Awaited<ReturnType<typeof loadProfile>>;
