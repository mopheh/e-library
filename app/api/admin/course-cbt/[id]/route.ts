import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { questions, options } from "@/database/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const optionSchema = z.object({
  id: z.string().uuid().optional(),
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

const updateQuestionSchema = z.object({
  courseId: z.string().min(1).optional(),
  questionText: z.string().min(5).optional(),
  explanation: z.string().optional().nullable(),
  options: z
    .array(optionSchema)
    .min(2)
    .max(6)
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Exactly one option must be marked as correct",
    })
    .optional(),
});

// ── PATCH /api/admin/course-cbt/[id] ──────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const body = await req.json();
  const result = updateQuestionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.errors },
      { status: 400 }
    );
  }

  const { courseId, questionText, explanation, options: updatedOptionsList } = result.data;

  try {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const updateData: Partial<typeof questions.$inferInsert> = {};
    if (courseId !== undefined) updateData.courseId = courseId;
    if (questionText !== undefined) updateData.questionText = questionText;
    if (explanation !== undefined) updateData.explanation = explanation ?? undefined;

    const [updatedQuestion] =
      Object.keys(updateData).length > 0
        ? await db
            .update(questions)
            .set(updateData)
            .where(eq(questions.id, id))
            .returning()
        : [existing];

    let finalOptions = await db
      .select()
      .from(options)
      .where(eq(options.questionId, id));

    if (updatedOptionsList) {
      await db.delete(options).where(eq(options.questionId, id));
      finalOptions = await db
        .insert(options)
        .values(
          updatedOptionsList.map((opt) => ({
            questionId: id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          }))
        )
        .returning();
    }

    return NextResponse.json({
      success: true,
      question: { ...updatedQuestion, options: finalOptions },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/course-cbt/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE /api/admin/course-cbt/[id] ─────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await db.delete(questions).where(eq(questions.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("[DELETE /api/admin/course-cbt/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
