import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { threads, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const threadSchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  content: z.string().min(1, "content is required").max(5000),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;

    const courseThreads = await db
      .select({
        id: threads.id,
        title: threads.title,
        content: threads.content,
        createdAt: threads.createdAt,
        author: { id: users.id, fullName: users.fullName },
      })
      .from(threads)
      .innerJoin(users, eq(threads.authorId, users.id))
      .where(eq(threads.courseId, courseId))
      .orderBy(desc(threads.createdAt));

    return NextResponse.json(courseThreads);
  } catch (error) {
    console.error("[GET /api/courses/[courseId]/threads]", error);
    return NextResponse.json({ error: "Failed to load threads" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;

    const result = threadSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { title, content } = result.data;

    const [newThread] = await db
      .insert(threads)
      .values({ courseId, authorId: user.id, title, content })
      .returning();

    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error("[POST /api/courses/[courseId]/threads]", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
