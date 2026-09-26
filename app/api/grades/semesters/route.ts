import { db } from "@/database/drizzle";
import { courseGrades, semesterResults } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { loadGrades } from "@/lib/grades";
import { LETTER_GRADES, isValidSession } from "@/lib/grading";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const semesterSchema = z.object({
  session: z.string().refine(isValidSession, "Session must look like 2025/2026"),
  semester: z.enum(["FIRST", "SECOND"]),
  level: z.enum(["100", "200", "300", "400", "500", "600"]),
  courses: z
    .array(
      z.object({
        courseId: z.string().uuid().nullable().optional(),
        courseCode: z.string().trim().toUpperCase().min(2).max(20),
        courseTitle: z.string().trim().max(255).nullable().optional(),
        units: z.number().int().min(1).max(12),
        grade: z.enum(LETTER_GRADES),
      }),
    )
    .min(1, "Add at least one course")
    .max(25),
});

/**
 * Saves one semester's results. Same session + semester replaces what was
 * there (editing), so re-saving never creates duplicates.
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = semesterSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid results" }, { status: 400 });
    }
    const { session, semester, level, courses } = parsed.data;

    const codes = courses.map((c) => c.courseCode.replace(/\s+/g, ""));
    if (new Set(codes).size !== codes.length) {
      return NextResponse.json({ error: "Each course can only appear once per semester." }, { status: 400 });
    }

    const [result] = await db
      .insert(semesterResults)
      .values({ userId: user.id, session, semester, level })
      .onConflictDoUpdate({
        target: [semesterResults.userId, semesterResults.session, semesterResults.semester],
        set: { level, updatedAt: new Date() },
      })
      .returning({ id: semesterResults.id });

    // Replace the course list atomically (neon-http batch runs as one transaction)
    await db.batch([
      db.delete(courseGrades).where(eq(courseGrades.resultId, result.id)),
      db.insert(courseGrades).values(
        courses.map((c, i) => ({
          resultId: result.id,
          courseId: c.courseId ?? null,
          courseCode: codes[i],
          courseTitle: c.courseTitle || null,
          units: c.units,
          grade: c.grade,
        })),
      ),
    ]);

    return NextResponse.json(await loadGrades(user.id), { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error saving semester results:", error);
    return NextResponse.json({ error: "Couldn't save your results. Please try again." }, { status: 500 });
  }
}
