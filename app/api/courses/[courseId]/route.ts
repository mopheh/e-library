import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { courses, sessions, answers, questions, options } from "@/database/schema";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { courseId } = await context.params;
    const body = await req.json();
    const { courseCode, title, level, semester, unitLoad, departmentId } = body;

    // Check if course exists
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Update details
    await db
      .update(courses)
      .set({
        courseCode: courseCode !== undefined ? courseCode : existingCourse.courseCode,
        title: title !== undefined ? title : existingCourse.title,
        level: level !== undefined ? level : existingCourse.level,
        semester: semester !== undefined ? semester : existingCourse.semester,
        unitLoad: unitLoad !== undefined ? Number(unitLoad) : existingCourse.unitLoad,
        departmentId: departmentId !== undefined ? departmentId : existingCourse.departmentId,
      })
      .where(eq(courses.id, courseId));

    return NextResponse.json({ message: "Course updated successfully" });
  } catch (error: any) {
    console.error("[PUT /api/courses/[courseId]]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const authCheck = await requireRole(["ADMIN", "FACULTY REP"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { courseId } = await context.params;

    // Check if course exists
    const [existingCourse] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Start manual deletes for non-cascading relations to avoid FK violations
    
    // 1. Delete answers associated with sessions of this course
    const courseSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.courseId, courseId));
    
    if (courseSessions.length > 0) {
      const sessionIds = courseSessions.map((s) => s.id);
      await db.delete(answers).where(inArray(answers.sessionId, sessionIds));
      // 2. Delete sessions
      await db.delete(sessions).where(inArray(sessions.id, sessionIds));
    }

    // 3. Delete options associated with questions of this course
    const courseQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.courseId, courseId));

    if (courseQuestions.length > 0) {
      const questionIds = courseQuestions.map((q) => q.id);
      await db.delete(options).where(inArray(options.questionId, questionIds));
      // 4. Delete questions
      await db.delete(questions).where(inArray(questions.id, questionIds));
    }

    // 5. Delete course itself (this will cascade delete studyRooms, examInsights, survivalGuides, resourceRequests, bookCourses)
    await db.delete(courses).where(eq(courses.id, courseId));

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/courses/[courseId]]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}
