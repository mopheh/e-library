import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { courses, studentCourses } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    return NextResponse.json(
      { error: "Failed to load courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseIds } = body;

    if (!Array.isArray(courseIds)) {
      return NextResponse.json(
        { error: "Invalid payload. courseIds must be an array" },
        { status: 400 }
      );
    }

    // Delete existing enrollments
    await db
      .delete(studentCourses)
      .where(eq(studentCourses.userId, user.id));

    // Insert new enrollments
    if (courseIds.length > 0) {
      const enrollments = courseIds.map((courseId: string) => ({
        userId: user.id,
        courseId,
      }));
      await db.insert(studentCourses).values(enrollments);
    }

    return NextResponse.json({ success: true, message: "Courses updated successfully" });
  } catch (error) {
    console.error("[POST /api/users/courses]", error);
    return NextResponse.json(
      { error: "Failed to update courses" },
      { status: 500 }
    );
  }
}
