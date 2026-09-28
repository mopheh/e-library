import { and, desc, eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/database/drizzle";
import {
  academicProfiles,
  courseGrades,
  courses,
  departments,
  faculty,
  readingSessions,
  semesterResults,
  sessions as cbtSessions,
  studyLogs,
  users,
} from "@/database/schema";
import { cumulative, degreeClass, type LetterGrade } from "@/lib/grading";
import { lagosDate } from "@/lib/time";
import { MINUTES_PER_UNTIMED_SITTING } from "@/lib/planner";

// ── Admin "Student Performance" analytics ──────────────────────────────────
// Everything is computed for a scope of students (faculty / department /
// level filters) with a fixed number of set-based queries, then aggregated
// in memory - fine for the few-thousand-student scale of one university.

export interface PerformanceFilters {
  facultyId?: string | null;
  departmentId?: string | null;
  level?: string | null;
}

export type RiskFlag = "LOW_CGPA" | "INACTIVE" | "LOW_CBT";

export const RISK_RULES = {
  LOW_CGPA: 2.4, // below Second Class Lower
  INACTIVE_DAYS: 14,
  LOW_CBT: 40, // average % over the last 5 CBTs, needs >= 2 attempts
};

const DAY_MS = 86_400_000;
const dayStr = (daysAgo: number) => lagosDate(new Date(Date.now() - daysAgo * DAY_MS));

function scopeWhere(f: PerformanceFilters): SQL {
  const parts: SQL[] = [eq(users.role, "STUDENT")];
  if (f.facultyId) parts.push(eq(users.facultyId, f.facultyId));
  if (f.departmentId) parts.push(eq(users.departmentId, f.departmentId));
  if (f.level) parts.push(eq(users.year, f.level as (typeof users.year.enumValues)[number]));
  return and(...parts)!;
}

interface StudentRow {
  id: string;
  fullName: string;
  matricNo: string;
  level: string;
  departmentId: string;
  departmentName: string;
  facultyName: string;
}

/** One pass over every data source for the students in scope. */
async function loadScope(f: PerformanceFilters) {
  const students: StudentRow[] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      matricNo: users.matricNo,
      level: users.year,
      departmentId: users.departmentId,
      departmentName: departments.name,
      facultyName: faculty.name,
    })
    .from(users)
    .innerJoin(departments, eq(departments.id, users.departmentId))
    .innerJoin(faculty, eq(faculty.id, users.facultyId))
    .where(scopeWhere(f));

  const ids = students.map((s) => s.id);
  if (ids.length === 0) {
    return { students, appDaily: [], loggedDaily: [], methods: [], cbt: [], profiles: [], results: [], grades: [] };
  }
  const since = dayStr(60); // covers 8-week patterns + 30-day trends

  const [appDaily, loggedDaily, methods, cbt, profiles, results] = await Promise.all([
    db
      .select({ userId: readingSessions.userId, date: readingSessions.date, minutes: sql<number>`sum(${readingSessions.duration})` })
      .from(readingSessions)
      .where(and(inArray(readingSessions.userId, ids), gte(readingSessions.date, since)))
      .groupBy(readingSessions.userId, readingSessions.date),
    db
      .select({
        userId: studyLogs.userId,
        date: studyLogs.date,
        minutes: sql<number>`sum(coalesce(${studyLogs.minutes}, ${studyLogs.timesRead} * ${MINUTES_PER_UNTIMED_SITTING}))`,
      })
      .from(studyLogs)
      .where(and(inArray(studyLogs.userId, ids), gte(studyLogs.date, since)))
      .groupBy(studyLogs.userId, studyLogs.date),
    db
      .select({ method: studyLogs.method, count: sql<number>`count(*)` })
      .from(studyLogs)
      .where(and(inArray(studyLogs.userId, ids), gte(studyLogs.date, dayStr(29))))
      .groupBy(studyLogs.method),
    db
      .select({ userId: cbtSessions.userId, courseId: cbtSessions.courseId, score: cbtSessions.score, completedAt: cbtSessions.completedAt })
      .from(cbtSessions)
      .where(and(inArray(cbtSessions.userId, ids), sql`${cbtSessions.completedAt} is not null`, sql`${cbtSessions.score} is not null`))
      .orderBy(desc(cbtSessions.completedAt)),
    db.select().from(academicProfiles).where(inArray(academicProfiles.userId, ids)),
    db.select().from(semesterResults).where(inArray(semesterResults.userId, ids)),
  ]);
  const grades = results.length
    ? await db
        .select({ resultId: courseGrades.resultId, units: courseGrades.units, grade: courseGrades.grade })
        .from(courseGrades)
        .where(inArray(courseGrades.resultId, results.map((r) => r.id)))
    : [];

  return { students, appDaily, loggedDaily, methods, cbt, profiles, results, grades };
}

type Scope = Awaited<ReturnType<typeof loadScope>>;

/** Per-student derived metrics (CGPA, activity, CBT, risk flags). */
function perStudent(scope: Scope) {
  const today = dayStr(0);
  const d14 = dayStr(13);
  const d30 = dayStr(29);

  const minutesByUser = new Map<string, { m14: number; m30: number; lastActive: string | null; days30: Set<string> }>();
  const touch = (userId: string, date: string, minutes: number) => {
    const e = minutesByUser.get(userId) ?? { m14: 0, m30: 0, lastActive: null, days30: new Set<string>() };
    if (date >= d14 && date <= today) e.m14 += minutes;
    if (date >= d30 && date <= today) { e.m30 += minutes; e.days30.add(date); }
    if (!e.lastActive || date > e.lastActive) e.lastActive = date;
    minutesByUser.set(userId, e);
  };
  for (const r of scope.appDaily) touch(r.userId, r.date, Number(r.minutes || 0));
  for (const r of scope.loggedDaily) touch(r.userId, r.date, Number(r.minutes || 0));

  const cbtByUser = new Map<string, number[]>();
  for (const c of scope.cbt) {
    if (!c.userId || c.score == null) continue;
    const list = cbtByUser.get(c.userId) ?? [];
    if (list.length < 5) list.push(c.score); // newest first
    cbtByUser.set(c.userId, list);
  }

  const gradesByResult = new Map<string, { units: number; grade: LetterGrade }[]>();
  for (const g of scope.grades) {
    gradesByResult.set(g.resultId, [...(gradesByResult.get(g.resultId) ?? []), { units: g.units, grade: g.grade }]);
  }
  const resultsByUser = new Map<string, typeof scope.results>();
  for (const r of scope.results) resultsByUser.set(r.userId, [...(resultsByUser.get(r.userId) ?? []), r]);
  const profileByUser = new Map(scope.profiles.map((p) => [p.userId, p]));

  return scope.students.map((s) => {
    const act = minutesByUser.get(s.id);
    const cbt = cbtByUser.get(s.id) ?? [];
    const cbtAvg = cbt.length ? Math.round(cbt.reduce((a, b) => a + b, 0) / cbt.length) : null;

    const p = profileByUser.get(s.id);
    const semesters = (resultsByUser.get(s.id) ?? []).map((r) => ({
      session: r.session,
      semester: r.semester,
      courses: gradesByResult.get(r.id) ?? [],
    }));
    const cum = cumulative({ cgpa: p?.priorCgpa ?? null, units: p?.priorUnits ?? null }, semesters);
    const cls = cum.cgpa != null ? degreeClass(cum.cgpa) : null;

    const inactive = !act?.lastActive || act.lastActive < dayStr(RISK_RULES.INACTIVE_DAYS - 1);
    const flags: RiskFlag[] = [];
    if (cum.cgpa != null && cum.cgpa < RISK_RULES.LOW_CGPA) flags.push("LOW_CGPA");
    if (inactive) flags.push("INACTIVE");
    if (cbtAvg != null && cbt.length >= 2 && cbtAvg < RISK_RULES.LOW_CBT) flags.push("LOW_CBT");

    return {
      ...s,
      minutes14: act?.m14 ?? 0,
      minutes30: act?.m30 ?? 0,
      activeDays30: act?.days30.size ?? 0,
      lastActive: act?.lastActive ?? null,
      cbtAvg,
      cbtAttempts: cbt.length,
      cgpa: cum.cgpa,
      degreeClass: cls ? cls.key : null,
      flags,
    };
  });
}

export type StudentPerformance = ReturnType<typeof perStudent>[number];

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);
const round2 = (n: number | null) => (n == null ? null : Math.round(n * 100) / 100);

export async function performanceOverview(f: PerformanceFilters) {
  const scope = await loadScope(f);
  const rows = perStudent(scope);
  const n = rows.length;
  const d7 = dayStr(6);

  // Daily trend (last 30 days): minutes in-app vs logged, and active students
  const days = Array.from({ length: 30 }, (_, i) => dayStr(29 - i));
  const trend = new Map(days.map((d) => [d, { date: d, appMinutes: 0, loggedMinutes: 0, active: new Set<string>() }]));
  for (const r of scope.appDaily) { const t = trend.get(r.date); if (t) { t.appMinutes += Number(r.minutes || 0); t.active.add(r.userId); } }
  for (const r of scope.loggedDaily) { const t = trend.get(r.date); if (t) { t.loggedMinutes += Number(r.minutes || 0); t.active.add(r.userId); } }

  // Weekday pattern over the last 8 weeks (0 = Monday)
  const weekday = Array.from({ length: 7 }, (_, i) => ({ day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i], minutes: 0 }));
  const since56 = dayStr(55);
  for (const r of [...scope.appDaily, ...scope.loggedDaily]) {
    if (r.date < since56) continue;
    const dow = (new Date(`${r.date}T12:00:00Z`).getUTCDay() + 6) % 7;
    weekday[dow].minutes += Number(r.minutes || 0);
  }

  const withCgpa = rows.filter((r) => r.cgpa != null);
  const classCounts = ["FIRST", "SECOND_UPPER", "SECOND_LOWER", "THIRD", "NONE"].map((key) => ({
    key,
    count: withCgpa.filter((r) => r.degreeClass === key).length,
  }));
  const active30 = rows.filter((r) => r.minutes30 > 0);

  const byDept = new Map<string, StudentPerformance[]>();
  for (const r of rows) byDept.set(r.departmentId, [...(byDept.get(r.departmentId) ?? []), r]);
  const departmentsTable = [...byDept.values()]
    .map((list) => {
      const active = list.filter((r) => r.minutes30 > 0);
      const cg = list.filter((r) => r.cgpa != null).map((r) => r.cgpa!);
      const cb = list.filter((r) => r.cbtAvg != null).map((r) => r.cbtAvg!);
      return {
        departmentId: list[0].departmentId,
        departmentName: list[0].departmentName,
        facultyName: list[0].facultyName,
        students: list.length,
        activePct: Math.round((active.length / list.length) * 100),
        // average per student in the department, per week (30 days ≈ 4.3 weeks)
        avgWeeklyMinutes: Math.round(list.reduce((a, r) => a + r.minutes30, 0) / list.length / (30 / 7)),
        avgCbt: round1(avg(cb)),
        avgCgpa: round2(avg(cg)),
        withCgpa: cg.length,
        needsAttention: list.filter((r) => r.flags.length > 0).length,
      };
    })
    .sort((a, b) => b.students - a.students);

  return {
    kpis: {
      students: n,
      active7: rows.filter((r) => r.lastActive != null && r.lastActive >= d7).length,
      active30: active30.length,
      avgWeeklyMinutesPerActive: active30.length ? Math.round(active30.reduce((a, r) => a + r.minutes30, 0) / active30.length / (30 / 7)) : 0,
      avgCbt: round1(avg(rows.filter((r) => r.cbtAvg != null).map((r) => r.cbtAvg!))),
      avgCgpa: round2(avg(withCgpa.map((r) => r.cgpa!))),
      withCgpa: withCgpa.length,
      needsAttention: rows.filter((r) => r.flags.length > 0).length,
    },
    trend: [...trend.values()].map((t) => ({ date: t.date, appMinutes: t.appMinutes, loggedMinutes: t.loggedMinutes, activeStudents: t.active.size })),
    weekday,
    methods: scope.methods.map((m) => ({ method: m.method, count: Number(m.count) })).sort((a, b) => b.count - a.count),
    classDistribution: classCounts,
    departments: departmentsTable,
  };
}

export type StudentSort = "name" | "cgpa" | "minutes" | "cbt" | "lastActive" | "risk";

export async function performanceStudents(
  f: PerformanceFilters & { search?: string | null; atRisk?: boolean; sort?: StudentSort; dir?: "asc" | "desc"; page?: number; pageSize?: number },
) {
  const rows = perStudent(await loadScope(f));
  const q = f.search?.trim().toLowerCase();
  let list = rows.filter((r) => (!f.atRisk || r.flags.length > 0) && (!q || r.fullName.toLowerCase().includes(q) || r.matricNo.toLowerCase().includes(q)));

  const dir = f.dir === "asc" ? 1 : -1;
  const key: Record<StudentSort, (r: StudentPerformance) => number | string> = {
    name: (r) => r.fullName.toLowerCase(),
    cgpa: (r) => r.cgpa ?? -1,
    minutes: (r) => r.minutes14,
    cbt: (r) => r.cbtAvg ?? -1,
    lastActive: (r) => r.lastActive ?? "",
    risk: (r) => r.flags.length,
  };
  const k = key[f.sort ?? "risk"];
  list = [...list].sort((a, b) => {
    const x = k(a), y = k(b);
    return (x < y ? -1 : x > y ? 1 : 0) * dir || a.fullName.localeCompare(b.fullName);
  });

  const pageSize = Math.min(100, Math.max(10, f.pageSize ?? 25));
  const total = list.length;
  const page = Math.min(Math.max(1, f.page ?? 1), Math.max(1, Math.ceil(total / pageSize)));
  return { students: list.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Everything about one student for the admin detail view. */
export async function studentPerformanceDetail(userId: string) {
  const { loadGrades } = await import("@/lib/grades");
  const { computePlan } = await import("@/lib/planner");

  const [[student]] = await Promise.all([
    db
      .select({
        id: users.id, fullName: users.fullName, matricNo: users.matricNo, email: users.email, level: users.year, role: users.role,
        departmentName: departments.name, facultyName: faculty.name, createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(departments, eq(departments.id, users.departmentId))
      .innerJoin(faculty, eq(faculty.id, users.facultyId))
      .where(eq(users.id, userId))
      .limit(1),
  ]);
  if (!student) return null;

  const since = dayStr(55);
  const [grades, plan, app, logged, cbt, recentLogs] = await Promise.all([
    loadGrades(userId),
    computePlan(userId),
    db.select({ date: readingSessions.date, minutes: sql<number>`sum(${readingSessions.duration})` }).from(readingSessions)
      .where(and(eq(readingSessions.userId, userId), gte(readingSessions.date, since))).groupBy(readingSessions.date),
    db.select({ date: studyLogs.date, minutes: sql<number>`sum(coalesce(${studyLogs.minutes}, ${studyLogs.timesRead} * ${MINUTES_PER_UNTIMED_SITTING}))` }).from(studyLogs)
      .where(and(eq(studyLogs.userId, userId), gte(studyLogs.date, since))).groupBy(studyLogs.date),
    db.select({
      courseCode: courses.courseCode, title: courses.title,
      attempts: sql<number>`count(*)`, avgScore: sql<number>`round(avg(${cbtSessions.score}))`, best: sql<number>`max(${cbtSessions.score})`,
      last: sql<string>`max(${cbtSessions.completedAt})`,
    }).from(cbtSessions).innerJoin(courses, eq(courses.id, cbtSessions.courseId))
      .where(and(eq(cbtSessions.userId, userId), sql`${cbtSessions.completedAt} is not null`))
      .groupBy(courses.courseCode, courses.title).orderBy(sql`max(${cbtSessions.completedAt}) desc`),
    db.select({ date: studyLogs.date, courseCode: courses.courseCode, timesRead: studyLogs.timesRead, minutes: studyLogs.minutes, method: studyLogs.method })
      .from(studyLogs).innerJoin(courses, eq(courses.id, studyLogs.courseId))
      .where(eq(studyLogs.userId, userId)).orderBy(desc(studyLogs.date), desc(studyLogs.createdAt)).limit(10),
  ]);

  // 8 weekly buckets (Mon-based), oldest first
  const weeks = Array.from({ length: 8 }, (_, i) => ({ weekOf: dayStr(55 - i * 7), app: 0, logged: 0 }));
  const bucket = (date: string) => Math.min(7, Math.floor((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${since}T12:00:00Z`)) / (7 * DAY_MS)));
  for (const r of app) if (r.date >= since) weeks[bucket(r.date)].app += Number(r.minutes || 0);
  for (const r of logged) if (r.date >= since) weeks[bucket(r.date)].logged += Number(r.minutes || 0);

  return {
    student,
    grades: { summary: grades.summary, semesters: grades.semesters.map((s) => ({ session: s.session, semester: s.semester, level: s.level, gpa: s.gpa, units: s.units })) },
    studyWeeks: weeks,
    cbt: cbt.map((c) => ({ ...c, attempts: Number(c.attempts), avgScore: Number(c.avgScore), best: Number(c.best) })),
    readiness: plan.courses.map((c) => ({ courseCode: c.courseCode, readiness: c.readiness, band: c.band, daysToExam: c.daysToExam })),
    recentLogs,
  };
}
