import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { academicProfiles, courseGrades, semesterResults } from "@/database/schema";
import { cumulative, degreeClass, gpa, nextDegreeClass, semesterOrder, totals } from "@/lib/grading";

/** Everything the Grades page needs for one student, CGPA computed server-side. */
export async function loadGrades(userId: string) {
  const [[profile], results] = await Promise.all([
    db.select().from(academicProfiles).where(eq(academicProfiles.userId, userId)).limit(1),
    db.select().from(semesterResults).where(eq(semesterResults.userId, userId)),
  ]);

  const grades = results.length
    ? await db
        .select()
        .from(courseGrades)
        .where(inArray(courseGrades.resultId, results.map((r) => r.id)))
        .orderBy(asc(courseGrades.courseCode))
    : [];

  const semesters = results
    .map((r) => {
      const courses = grades
        .filter((g) => g.resultId === r.id)
        .map((g) => ({
          id: g.id,
          courseId: g.courseId,
          courseCode: g.courseCode,
          courseTitle: g.courseTitle,
          units: g.units,
          grade: g.grade,
        }));
      return {
        id: r.id,
        session: r.session,
        semester: r.semester,
        level: r.level,
        hasSlip: Boolean(r.slipUrl),
        courses,
        gpa: gpa(courses),
        units: totals(courses).units,
      };
    })
    .sort(semesterOrder);

  const prior = { cgpa: profile?.priorCgpa ?? null, units: profile?.priorUnits ?? null };
  const cum = cumulative(prior, semesters);
  const cls = cum.cgpa != null ? degreeClass(cum.cgpa) : null;
  const next = cum.cgpa != null ? nextDegreeClass(cum.cgpa) : null;

  return {
    profile: {
      priorCgpa: prior.cgpa,
      priorUnits: prior.units,
      targetCgpa: profile?.targetCgpa ?? null,
    },
    semesters,
    summary: {
      cgpa: cum.cgpa,
      totalUnits: cum.units,
      totalPoints: cum.points,
      degreeClass: cls ? { key: cls.key, label: cls.label } : null,
      next: next ? { label: next.cls.label, min: next.cls.min, gap: next.gap } : null,
      timeline: cum.timeline,
    },
  };
}

export type GradesPayload = Awaited<ReturnType<typeof loadGrades>>;
