import { db } from "@/database/drizzle";
import { annotations, users } from "@/database/schema";
import { eq, and, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const annotationSchema = z.object({
  pageNumber: z.number().int().nonnegative("pageNumber must be a non-negative integer"),
  text: z.string().min(1, "text is required"),
  coordinates: z.array(z.record(z.unknown())).optional().nullable(),
  color: z.string().optional().default("yellow"),
  isPublic: z.boolean().optional().default(false),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: bookId } = await params;

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
        },
      })
      .from(annotations)
      .leftJoin(users, eq(annotations.userId, users.id))
      .where(
        and(
          eq(annotations.bookId, bookId),
          or(eq(annotations.userId, user.id), eq(annotations.isPublic, true))
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

    const result = annotationSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { pageNumber, text, coordinates, color, isPublic } = result.data;

    const [newAnnotation] = await db
      .insert(annotations)
      .values({
        bookId,
        userId: user.id,
        pageNumber,
        text,
        coordinates: coordinates ?? null,
        color,
        isPublic,
      })
      .returning();

    return NextResponse.json(newAnnotation, { status: 201 });
  } catch (error) {
    console.error("[POST /api/books/[id]/annotations]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
