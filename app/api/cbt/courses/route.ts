import { db } from "@/database/drizzle";
import { courses, questions, options } from "@/database/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {

        const coursesWithCounts = await db
            .select({
                id: courses.id,
                name: courses.courseCode,
                questionCount: sql<number>`count(${questions.id})`.as("question_count"),
            })
            .from(courses)
            .leftJoin(questions, eq(questions.courseId, courses.id))
            .groupBy(courses.id);


        const courseIds = coursesWithCounts.map((c) => c.id);
        const courseQuestions = await db
            .select({
                id: questions.id,
                courseId: questions.courseId,
                questionText: questions.questionText,
                type: questions.type,
            })
            .from(questions)
            .where(inArray(questions.courseId, courseIds));


        const questionIds = courseQuestions.map((q) => q.id);
        const questionOptions = await db
            .select({
                id: options.id,
                questionId: options.questionId,
                optionText: options.optionText,
                isCorrect: options.isCorrect,
            })
            .from(options)
            .where(inArray(options.questionId, questionIds));


        const questionsWithOptions = courseQuestions.map((q) => ({
            ...q,
            options: questionOptions.filter((o) => o.questionId === q.id),
        }));

        const data = coursesWithCounts.map((course) => ({
            ...course,
            questions: questionsWithOptions.filter((q) => q.courseId === course.id),
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching CBT courses with questions and options:", error);
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
}
