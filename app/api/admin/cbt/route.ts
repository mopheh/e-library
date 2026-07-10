import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { postUtmeQuestions, postUtmeOptions } from "@/database/schema";
import { eq, ilike, sql, and, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

// ── Validation ─────────────────────────────────────────────────────────
const optionSchema = z.object({
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

const createQuestionSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  questionText: z.string().min(5, "Question text must be at least 5 characters"),
  explanation: z.string().optional(),
  options: z
    .array(optionSchema)
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed")
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Exactly one option must be marked as correct",
    }),
});

// ── GET /api/admin/cbt ─────────────────────────────────────────────────
// Query params: subject?, search?, page?, limit?
export async function GET(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") || "";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (subject) conditions.push(eq(postUtmeQuestions.subject, subject));
    if (search) conditions.push(ilike(postUtmeQuestions.questionText, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [questions, [{ count }]] = await Promise.all([
      db
        .select()
        .from(postUtmeQuestions)
        .where(whereClause)
        .orderBy(postUtmeQuestions.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(postUtmeQuestions)
        .where(whereClause),
    ]);

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
      options: optionMap.get(q.id) ?? [],
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/cbt]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST /api/admin/cbt ────────────────────────────────────────────────
// Body: { subject, questionText, explanation?, options: [{optionText, isCorrect}] }
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const result = createQuestionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.errors },
      { status: 400 }
    );
  }

  const { subject, questionText, explanation, options } = result.data;

  try {
    const [question] = await db
      .insert(postUtmeQuestions)
      .values({ subject: subject.toLowerCase(), questionText, explanation })
      .returning();

    const insertedOptions = await db
      .insert(postUtmeOptions)
      .values(
        options.map((opt) => ({
          questionId: question.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        }))
      )
      .returning();

    return NextResponse.json(
      { success: true, question: { ...question, options: insertedOptions } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/cbt]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
