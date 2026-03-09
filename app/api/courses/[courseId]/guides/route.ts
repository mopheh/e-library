import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { survivalGuides, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;

    const data = await db
      .select({
        id: survivalGuides.id,
        title: survivalGuides.title,
        content: survivalGuides.content,
        upvotes: survivalGuides.upvotes,
        createdAt: survivalGuides.createdAt,
        author: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        }
      })
      .from(survivalGuides)
      .leftJoin(users, eq(survivalGuides.authorId, users.id))
      .where(eq(survivalGuides.courseId, courseId))
      .orderBy(desc(survivalGuides.upvotes), desc(survivalGuides.createdAt)); // highest upvotes first

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/courses/[courseId]/guides]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const [newGuide] = await db.insert(survivalGuides).values({
      courseId,
      authorId: user.id,
      title,
      content,
    }).returning();

    return NextResponse.json(newGuide, { status: 201 });
  } catch (error) {
    console.error("[POST /api/courses/[courseId]/guides]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
