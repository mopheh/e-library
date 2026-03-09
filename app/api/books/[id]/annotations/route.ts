import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { annotations, users } from "@/database/schema";
import { eq, and, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: bookId } = await params;

    // Fetch user's own annotations AND any public annotations from others
    const data = await db
      .select({
        id: annotations.id,
        bookId: annotations.bookId,
        userId: annotations.userId,
        pageNumber: annotations.pageNumber,
        text: annotations.text,
        coordinates: annotations.coordinates,
        color: annotations.color,
        isPublic: annotations.isPublic,
        createdAt: annotations.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName,
        }
      })
      .from(annotations)
      .leftJoin(users, eq(annotations.userId, users.id))
      .where(
        and(
          eq(annotations.bookId, bookId),
          or(
            eq(annotations.userId, user.id),
            eq(annotations.isPublic, true)
          )
        )
      );

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/books/[id]/annotations]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: bookId } = await params;
    const body = await req.json();
    const { pageNumber, text, coordinates, color, isPublic } = body;

    if (!pageNumber || !text) {
      return NextResponse.json({ error: "pageNumber and text are required" }, { status: 400 });
    }

    const [newAnnotation] = await db.insert(annotations).values({
      bookId,
      userId: user.id,
      pageNumber,
      text,
      coordinates,
      color: color || "yellow",
      isPublic: isPublic || false,
    }).returning();

    return NextResponse.json(newAnnotation, { status: 201 });
  } catch (error) {
    console.error("[POST /api/books/[id]/annotations]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
