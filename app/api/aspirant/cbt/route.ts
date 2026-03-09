import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { postUtmeQuestions, postUtmeOptions, candidateAttempts, users } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");

    // Fetch up to 10 random questions
    let questions;
    if (subject) {
      questions = await db.select().from(postUtmeQuestions).where(eq(postUtmeQuestions.subject, subject)).orderBy(sql`RANDOM()`).limit(10);
    } else {
      questions = await db.select().from(postUtmeQuestions).orderBy(sql`RANDOM()`).limit(10);
    }
    
    // Fetch options for these questions
    const questionIds = questions.map((q) => q.id);
    let options: any[] = [];
    if (questionIds.length > 0) {
       options = await db
        .select()
        .from(postUtmeOptions)
        .where(sql`${postUtmeOptions.questionId} IN (${sql.join(questionIds, sql`, `)})`);
    }

    const formattedQuestions = questions.map((q) => ({
      ...q,
      options: options.filter((o) => o.questionId === q.id).map(o => ({
        id: o.id,
        optionText: o.optionText,
      })),
    }));

    return NextResponse.json({ success: true, questions: formattedQuestions });
  } catch (error) {
    console.error("Fetch CBT Questions Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { score, totalQuestions } = body;

    const [attempt] = await db.insert(candidateAttempts).values({
      userId: user.id,
      score,
      totalQuestions,
      completedAt: new Date(),
    }).returning();

    return NextResponse.json({ success: true, attempt });
  } catch (error) {
    console.error("CBT Attempt Submit Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
