import { db } from "@/database/drizzle";
import { sessions, answers } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, score, userAnswers } = body;

    if (!courseId || score === undefined || !Array.isArray(userAnswers)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 1. Create the session record
    const [newSession] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        courseId,
        score,
        completedAt: new Date(),
      })
      .returning();

    // 2. Insert all the answers
    if (userAnswers.length > 0) {
      const answersToInsert = userAnswers.map((ans) => ({
        sessionId: newSession.id,
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId || null,
        isCorrect: ans.isCorrect,
      }));

      await db.insert(answers).values(answersToInsert);
    }

    return NextResponse.json({ success: true, session: newSession });
  } catch (error) {
    console.error("Error saving CBT session:", error);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 }
    );
  }
}
