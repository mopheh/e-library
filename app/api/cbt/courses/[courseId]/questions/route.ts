import { db } from "@/database/drizzle";
import { questions, options, studentCourses } from "@/database/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { shuffle } from "@/lib/shuffle";

// Draws a fresh random subset of a course's question bank (and shuffles each
// question's option order) on every call, so re-taking a CBT for the same
// course doesn't keep surfacing the same questions in the same order with
// the correct answer sitting in the same position.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const [registration] = await db
      .select({ id: studentCourses.id })
      .from(studentCourses)
      .where(and(eq(studentCourses.userId, user.id), eq(studentCourses.courseId, courseId)));

    if (!registration) {
      return NextResponse.json({ error: "You are not registered for this course" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100);

    const selectedQuestions = await db
      .select({
        id: questions.id,
        courseId: questions.courseId,
        questionText: questions.questionText,
        type: questions.type,
      })
      .from(questions)
      .where(eq(questions.courseId, courseId))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    const questionIds = selectedQuestions.map((q) => q.id);
    const questionOptions = questionIds.length > 0
      ? await db
          .select({
            id: options.id,
            questionId: options.questionId,
            optionText: options.optionText,
            isCorrect: options.isCorrect,
          })
          .from(options)
          .where(inArray(options.questionId, questionIds))
      : [];

    const optionsByQuestion = new Map<string, typeof questionOptions>();
    for (const opt of questionOptions) {
      if (!opt.questionId) continue;
      if (!optionsByQuestion.has(opt.questionId)) optionsByQuestion.set(opt.questionId, []);
      optionsByQuestion.get(opt.questionId)!.push(opt);
    }

    const data = selectedQuestions.map((q) => ({
      ...q,
      options: shuffle(optionsByQuestion.get(q.id) ?? []),
    }));

    return NextResponse.json({ success: true, questions: data });
  } catch (error) {
    console.error("[GET /api/cbt/courses/[courseId]/questions]", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
