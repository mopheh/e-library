import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { questions, options } from "@/database/schema";
import { eq, ilike, sql, and, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

// ── Validation ─────────────────────────────────────────────────────────
const optionSchema = z.object({
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

const createQuestionSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  questionText: z.string().min(5, "Question text must be at least 5 characters"),
  explanation: z.string().optional().nullable(),
  options: z
    .array(optionSchema)
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed")
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Exactly one option must be marked as correct",
    }),
});

// ── GET /api/admin/course-cbt ──────────────────────────────────────────
export async function GET(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId") || "";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (courseId) conditions.push(eq(questions.courseId, courseId));
    if (search) conditions.push(ilike(questions.questionText, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [fetchedQuestions, [{ count }]] = await Promise.all([
      db
        .select()
        .from(questions)
        .where(whereClause)
        .orderBy(questions.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(questions)
        .where(whereClause),
    ]);

    const questionIds = fetchedQuestions.map((q) => q.id);
    const fetchedOptions =
      questionIds.length > 0
        ? await db
            .select()
            .from(options)
            .where(inArray(options.questionId, questionIds))
        : [];

    const optionMap = new Map<string, typeof fetchedOptions>();
    for (const opt of fetchedOptions) {
      if (!opt.questionId) continue;
      if (!optionMap.has(opt.questionId)) optionMap.set(opt.questionId, []);
      optionMap.get(opt.questionId)!.push(opt);
    }

    const formattedQuestions = fetchedQuestions.map((q) => ({
      ...q,
      options: optionMap.get(q.id) ?? [],
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/course-cbt]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE /api/admin/course-cbt?courseId=... ──────────────────────────
// Bulk-delete every question for a course - for quality cleanup (e.g. a
// course's questions came from a since-reparsed/garbled book and should be
// wiped before the auto-chained generation job repopulates them).
export async function DELETE(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  try {
    const deleted = await db
      .delete(questions)
      .where(eq(questions.courseId, courseId))
      .returning({ id: questions.id });

    return NextResponse.json({ success: true, deletedCount: deleted.length });
  } catch (error) {
    console.error("[DELETE /api/admin/course-cbt]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST /api/admin/course-cbt ─────────────────────────────────────────
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

  const { courseId, questionText, explanation, options: newOptions } = result.data;

  try {
    const [question] = await db
      .insert(questions)
      .values({ courseId, questionText, type: "multiple_choice", explanation })
      .returning();

    const insertedOptions = await db
      .insert(options)
      .values(
        newOptions.map((opt) => ({
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
    console.error("[POST /api/admin/course-cbt]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
