import { db } from "@/database/drizzle";
import { courses, questions, studentCourses } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Only the course list + counts are needed for the setup screen - the
// question bank itself (which can run into the hundreds per course) is
// fetched on demand, pre-shuffled, from /api/cbt/courses/[courseId]/questions
// once the student actually starts a test.
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const coursesWithCounts = await db
            .select({
                id: courses.id,
                name: courses.courseCode,
                questionCount: sql<number>`count(${questions.id})`.as("question_count"),
            })
            .from(courses)
            .innerJoin(studentCourses, eq(courses.id, studentCourses.courseId))
            .leftJoin(questions, eq(questions.courseId, courses.id))
            .where(eq(studentCourses.userId, user.id))
            .groupBy(courses.id);

        return NextResponse.json(coursesWithCounts);
    } catch (error) {
        console.error("Error fetching CBT courses:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
}
