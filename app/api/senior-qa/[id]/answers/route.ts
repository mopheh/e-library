import { db } from "@/database/drizzle";
import { seniorQaAnswers, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const answerSchema = z.object({
  content: z.string().min(1, "content is required"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const answers = await db
      .select({
        id: seniorQaAnswers.id,
        content: seniorQaAnswers.content,
        upvotes: seniorQaAnswers.upvotes,
        isAccepted: seniorQaAnswers.isAccepted,
        createdAt: seniorQaAnswers.createdAt,
        authorName: users.fullName,
        authorLevel: users.year,
        authorRole: users.role,
      })
      .from(seniorQaAnswers)
      .innerJoin(users, eq(seniorQaAnswers.authorId, users.id))
      .where(eq(seniorQaAnswers.questionId, id))
      .orderBy(seniorQaAnswers.createdAt);

    return NextResponse.json(answers);
  } catch (error) {
    console.error("[GET /api/senior-qa/[id]/answers]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: questionId } = await params;

    const result = answerSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }

    const [answer] = await db
      .insert(seniorQaAnswers)
      .values({
        questionId,
        authorId: user.id,
        content: result.data.content,
      })
      .returning();

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error("[POST /api/senior-qa/[id]/answers]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
