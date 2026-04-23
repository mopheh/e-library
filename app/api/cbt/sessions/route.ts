import { db } from "@/database/drizzle";
import { sessions, answers } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const answerItemSchema = z.object({
  questionId: z.string().uuid("questionId must be a valid UUID"),
  selectedOptionId: z.string().uuid("selectedOptionId must be a valid UUID").optional().nullable(),
  isCorrect: z.boolean(),
});

const cbtSessionSchema = z.object({
  courseId: z.string().uuid("courseId must be a valid UUID"),
  score: z.number().min(0).max(100),
  userAnswers: z.array(answerItemSchema).min(1, "At least one answer is required"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = cbtSessionSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { courseId, score, userAnswers } = result.data;

    // 1. Create the session record
    const [newSession] = await db
      .insert(sessions)
      .values({ userId: user.id, courseId, score, completedAt: new Date() })
      .returning();

    // 2. Batch-insert all answers
    if (userAnswers.length > 0) {
      await db.insert(answers).values(
        userAnswers.map((ans) => ({
          sessionId: newSession.id,
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId ?? null,
          isCorrect: ans.isCorrect,
        })),
      );
    }

    return NextResponse.json({ success: true, session: newSession }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cbt/sessions]", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
