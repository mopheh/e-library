// UNIBEN 5-point grading, shared by the server (CGPA summaries) and the
// browser (live previews) so they can never disagree.
// Scores: A 70-100, B 60-69, C 50-59, D 45-49, E 40-44, F 0-39.
// Classes: First 4.50-5.00, 2:1 3.50-4.49, 2:2 2.40-3.49, Third 1.50-2.39.
// The Pass class was abolished, so below 1.50 has no class of degree.

export const LETTER_GRADES = ["A", "B", "C", "D", "E", "F"] as const;
export type LetterGrade = (typeof LETTER_GRADES)[number];

export const GRADE_POINTS: Record<LetterGrade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

export const GRADE_SCORE_RANGES: Record<LetterGrade, string> = {
  A: "70–100",
  B: "60–69",
  C: "50–59",
  D: "45–49",
  E: "40–44",
  F: "0–39",
};

export const MAX_GPA = 5;

export interface DegreeClass {
  key: "FIRST" | "SECOND_UPPER" | "SECOND_LOWER" | "THIRD" | "NONE";
  label: string;
  short: string;
  min: number;
}

// Highest first
export const DEGREE_CLASSES: DegreeClass[] = [
  { key: "FIRST", label: "First Class", short: "First", min: 4.5 },
  { key: "SECOND_UPPER", label: "Second Class Upper", short: "2:1", min: 3.5 },
  { key: "SECOND_LOWER", label: "Second Class Lower", short: "2:2", min: 2.4 },
  { key: "THIRD", label: "Third Class", short: "Third", min: 1.5 },
  { key: "NONE", label: "Below Third Class", short: "—", min: 0 },
];

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function degreeClass(cgpa: number): DegreeClass {
  const value = round2(cgpa);
  return DEGREE_CLASSES.find((c) => value >= c.min) ?? DEGREE_CLASSES[DEGREE_CLASSES.length - 1];
}

/** The next class up and how far away it is, or null at First Class. */
export function nextDegreeClass(cgpa: number): { cls: DegreeClass; gap: number } | null {
  const current = degreeClass(cgpa);
  const idx = DEGREE_CLASSES.indexOf(current);
  if (idx <= 0) return null;
  const cls = DEGREE_CLASSES[idx - 1];
  return { cls, gap: round2(cls.min - round2(cgpa)) };
}

export interface GradedCourse {
  units: number;
  grade: LetterGrade;
}

export function totals(courses: GradedCourse[]) {
  const units = courses.reduce((s, c) => s + c.units, 0);
  const points = courses.reduce((s, c) => s + c.units * GRADE_POINTS[c.grade], 0);
  return { units, points };
}

export function gpa(courses: GradedCourse[]): number | null {
  const { units, points } = totals(courses);
  return units ? round2(points / units) : null;
}

export interface SemesterLike {
  session: string; // "2025/2026"
  semester: "FIRST" | "SECOND";
  courses: GradedCourse[];
}

/** Chronological order: by session year, FIRST before SECOND. */
export function semesterOrder(a: { session: string; semester: string }, b: { session: string; semester: string }) {
  return a.session.localeCompare(b.session) || (a.semester === b.semester ? 0 : a.semester === "FIRST" ? -1 : 1);
}

/**
 * CGPA from the "before these semesters" starting point (priorCgpa over
 * priorUnits - for students who don't want to type in every past semester)
 * plus every recorded semester, with the cumulative value after each one.
 */
export function cumulative(
  prior: { cgpa: number | null; units: number | null },
  semesters: SemesterLike[],
) {
  let units = prior.cgpa != null && prior.units ? prior.units : 0;
  let points = prior.cgpa != null && prior.units ? prior.cgpa * prior.units : 0;

  const timeline = [...semesters].sort(semesterOrder).map((s) => {
    const t = totals(s.courses);
    units += t.units;
    points += t.points;
    return {
      session: s.session,
      semester: s.semester,
      gpa: t.units ? round2(t.points / t.units) : null,
      cgpa: units ? round2(points / units) : null,
    };
  });

  return { cgpa: units ? round2(points / units) : null, units, points, timeline };
}

/**
 * GPA needed over `upcomingUnits` to finish at `target` CGPA.
 * Can come back > 5 (not reachable in one semester) or <= 0 (already safe).
 */
export function requiredGpa(current: { points: number; units: number }, target: number, upcomingUnits: number) {
  if (upcomingUnits <= 0) return null;
  return round2((target * (current.units + upcomingUnits) - current.points) / upcomingUnits);
}

/** Semesters (at `unitsPerSemester` each, all straight A's) to reach target, capped. */
export function semestersToReach(current: { points: number; units: number }, target: number, unitsPerSemester: number, cap = 8) {
  if (unitsPerSemester <= 0 || target > MAX_GPA) return null;
  let { points, units } = current;
  for (let n = 1; n <= cap; n++) {
    points += MAX_GPA * unitsPerSemester;
    units += unitsPerSemester;
    if (round2(points / units) >= target) return n;
  }
  return null;
}

/** "2025/2026"-style sessions, newest first, for pickers. */
export function recentSessions(count = 7, now = new Date()) {
  // UNIBEN sessions start around October
  const startYear = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: count }, (_, i) => `${startYear - i}/${startYear - i + 1}`);
}

export function isValidSession(session: string) {
  const m = /^(\d{4})\/(\d{4})$/.exec(session);
  return Boolean(m && Number(m[2]) === Number(m[1]) + 1);
}
