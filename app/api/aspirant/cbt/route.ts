import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { postUtmeQuestions, postUtmeOptions, candidateAttempts, users, candidateProfiles } from "@/database/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [profile] = await db.select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, user.id));

    if (!profile || !profile.subjectCombinations) {
      return NextResponse.json({ error: "CBT Profile not configured" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSubjectsParam = searchParams.get("subjects");
    const requestedLimit = parseInt(searchParams.get("limit") || "10", 10);

    const validUserSubjects = profile.subjectCombinations as string[];
    let subjectsToTest = requestedSubjectsParam 
      ? requestedSubjectsParam.split(",").map(s => s.trim().toLowerCase()) 
      : validUserSubjects;

    // Security: Ensure requested subjects exist completely inside their registered lock
    subjectsToTest = subjectsToTest.filter(s => validUserSubjects.includes(s));

    if (subjectsToTest.length === 0) {
      return NextResponse.json({ error: "Invalid subject parameters" }, { status: 400 });
    }

    // Query questions in parallel, segmented by subject limits
    const questionPromises = subjectsToTest.map(sub => 
      db.select()
        .from(postUtmeQuestions)
        .where(eq(postUtmeQuestions.subject, sub))
        .orderBy(sql`RANDOM()`)
        .limit(requestedLimit)
    );

    const rawQuestionsNested = await Promise.all(questionPromises);
    const questions = rawQuestionsNested.flat();
    
    const questionIds = questions.map((q) => q.id);
    let options: any[] = [];
    if (questionIds.length > 0) {
       options = await db
        .select()
        .from(postUtmeOptions)
        .where(inArray(postUtmeOptions.questionId, questionIds));
    }

    const formattedQuestions = questions.map((q) => ({
      ...q,
      explanation: q.explanation,
      options: options.filter((o) => o.questionId === q.id).map(o => ({
        id: o.id,
        optionText: o.optionText,
        isCorrect: o.isCorrect,
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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
