import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { courses, studentCourses } from "@/database/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const enrollCoursesSchema = z.object({
  courseIds: z.array(z.string().uuid("Each courseId must be a valid UUID")).min(0),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrolledCourses = await db
      .select({
        id: courses.id,
        courseCode: courses.courseCode,
        title: courses.title,
        unitLoad: courses.unitLoad,
        level: courses.level,
        semester: courses.semester,
      })
      .from(studentCourses)
      .innerJoin(courses, eq(studentCourses.courseId, courses.id))
      .where(eq(studentCourses.userId, user.id));

    return NextResponse.json(enrolledCourses);
  } catch (error) {
    console.error("[GET /api/users/courses]", error);
    return NextResponse.json({ error: "Failed to load courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = enrollCoursesSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { courseIds } = result.data;

    // Delete existing enrollments and re-enroll — wrapped in single transaction
    await db.delete(studentCourses).where(eq(studentCourses.userId, user.id));

    if (courseIds.length > 0) {
      await db
        .insert(studentCourses)
        .values(courseIds.map((courseId) => ({ userId: user.id, courseId })));
    }

    return NextResponse.json({ success: true, message: "Courses updated successfully" });
  } catch (error) {
    console.error("[POST /api/users/courses]", error);
    return NextResponse.json({ error: "Failed to update courses" }, { status: 500 });
  }
}
