import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { postUtmeQuestions, postUtmeOptions } from "@/database/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const optionSchema = z.object({
  id: z.string().uuid().optional(), // existing option id
  optionText: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean(),
});

const updateQuestionSchema = z.object({
  subject: z.string().min(1).optional(),
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

// ── PATCH /api/admin/cbt/[id] ──────────────────────────────────────────
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

  const { subject, questionText, explanation, options } = result.data;

  try {
    // Check question exists
    const [existing] = await db
      .select()
      .from(postUtmeQuestions)
      .where(eq(postUtmeQuestions.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Update question fields
    const updateData: Partial<typeof postUtmeQuestions.$inferInsert> = {};
    if (subject !== undefined) updateData.subject = subject.toLowerCase();
    if (questionText !== undefined) updateData.questionText = questionText;
    if (explanation !== undefined) updateData.explanation = explanation ?? undefined;

    const [updatedQuestion] =
      Object.keys(updateData).length > 0
        ? await db
            .update(postUtmeQuestions)
            .set(updateData)
            .where(eq(postUtmeQuestions.id, id))
            .returning()
        : [existing];

    // Replace options if provided (delete all, re-insert)
    let updatedOptions = await db
      .select()
      .from(postUtmeOptions)
      .where(eq(postUtmeOptions.questionId, id));

    if (options) {
      await db.delete(postUtmeOptions).where(eq(postUtmeOptions.questionId, id));
      updatedOptions = await db
        .insert(postUtmeOptions)
        .values(
          options.map((opt) => ({
            questionId: id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          }))
        )
        .returning();
    }

    return NextResponse.json({
      success: true,
      question: { ...updatedQuestion, options: updatedOptions },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/cbt/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── DELETE /api/admin/cbt/[id] ─────────────────────────────────────────
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
      .from(postUtmeQuestions)
      .where(eq(postUtmeQuestions.id, id));

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Options cascade-delete via FK constraint
    await db.delete(postUtmeQuestions).where(eq(postUtmeQuestions.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("[DELETE /api/admin/cbt/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
