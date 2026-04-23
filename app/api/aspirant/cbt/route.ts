import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { postUtmeQuestions, postUtmeOptions, candidateAttempts, candidateProfiles } from "@/database/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const submitAttemptSchema = z.object({
  score: z.number().int().nonnegative("score must be a non-negative integer"),
  totalQuestions: z.number().int().positive("totalQuestions must be a positive integer"),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, user.id));

    if (!profile || !profile.subjectCombinations) {
      return NextResponse.json({ error: "CBT Profile not configured" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSubjectsParam = searchParams.get("subjects");
    const requestedLimit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50); // cap at 50

    const validUserSubjects = profile.subjectCombinations as string[];
    let subjectsToTest = requestedSubjectsParam
      ? requestedSubjectsParam.split(",").map((s) => s.trim().toLowerCase())
      : validUserSubjects;

    // Security: only allow subjects the candidate is registered for
    subjectsToTest = subjectsToTest.filter((s) => validUserSubjects.includes(s));

    if (subjectsToTest.length === 0) {
      return NextResponse.json({ error: "Invalid subject parameters" }, { status: 400 });
    }

    // Fetch all subjects in parallel
    const rawQuestionsNested = await Promise.all(
      subjectsToTest.map((sub) =>
        db
          .select()
          .from(postUtmeQuestions)
          .where(eq(postUtmeQuestions.subject, sub))
          .orderBy(sql`RANDOM()`)
          .limit(requestedLimit),
      ),
    );

    const questions = rawQuestionsNested.flat();
    const questionIds = questions.map((q) => q.id);

    const options =
      questionIds.length > 0
        ? await db
            .select()
            .from(postUtmeOptions)
            .where(inArray(postUtmeOptions.questionId, questionIds))
        : [];

    const optionMap = new Map<string, typeof options>();
    for (const opt of options) {
      if (!optionMap.has(opt.questionId)) optionMap.set(opt.questionId, []);
      optionMap.get(opt.questionId)!.push(opt);
    }

    const formattedQuestions = questions.map((q) => ({
      ...q,
      options: (optionMap.get(q.id) ?? []).map((o) => ({
        id: o.id,
        optionText: o.optionText,
        isCorrect: o.isCorrect,
      })),
    }));

    return NextResponse.json({ success: true, questions: formattedQuestions });
  } catch (error) {
    console.error("[GET /api/aspirant/cbt]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = submitAttemptSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { score, totalQuestions } = result.data;

    const [attempt] = await db
      .insert(candidateAttempts)
      .values({ userId: user.id, score, totalQuestions, completedAt: new Date() })
      .returning();

    return NextResponse.json({ success: true, attempt }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/aspirant/cbt]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
