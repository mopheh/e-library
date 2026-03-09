import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { threads, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> } // Awaitable params for Next.js 15
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    
    const courseThreads = await db
      .select({
        id: threads.id,
        title: threads.title,
        content: threads.content,
        createdAt: threads.createdAt,
        author: {
          id: users.id,
          fullName: users.fullName,
        },
      })
      .from(threads)
      .innerJoin(users, eq(threads.authorId, users.id))
      .where(eq(threads.courseId, resolvedParams.courseId))
      .orderBy(desc(threads.createdAt));

    return NextResponse.json(courseThreads);
  } catch (error) {
    console.error("[GET /api/courses/[courseId]/threads]", error);
    return NextResponse.json(
      { error: "Failed to load threads" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const [newThread] = await db
      .insert(threads)
      .values({
        courseId: resolvedParams.courseId,
        authorId: user.id,
        title,
        content,
      })
      .returning();

    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error("[POST /api/courses/[courseId]/threads]", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
