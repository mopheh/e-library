import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { comments, users } from "@/database/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "content is required").max(2000),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { threadId } = await params;

    const threadComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        author: { id: users.id, fullName: users.fullName },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.threadId, threadId))
      .orderBy(asc(comments.createdAt));

    return NextResponse.json(threadComments);
  } catch (error) {
    console.error("[GET /api/threads/[threadId]/comments]", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { threadId } = await params;

    const result = commentSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }

    const [newComment] = await db
      .insert(comments)
      .values({ threadId, authorId: user.id, content: result.data.content })
      .returning();

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("[POST /api/threads/[threadId]/comments]", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
