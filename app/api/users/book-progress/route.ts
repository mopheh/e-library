import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/database/drizzle";
import { users, userBooks } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const progressSchema = z.object({
  bookId: z.string().uuid("bookId must be a valid UUID"),
  progress: z.number().int().min(0).max(100).default(0),
  lastPage: z.number().int().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = progressSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { bookId, progress, lastPage } = result.data;

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await db
      .insert(userBooks)
      .values({ userId: user.id, bookId, progress, lastPage, lastReadAt: new Date() })
      .onConflictDoUpdate({
        target: [userBooks.userId, userBooks.bookId],
        set: { progress, lastPage, lastReadAt: new Date(), updatedAt: new Date() },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/users/book-progress]", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [progress] = await db
      .select({ progress: userBooks.progress, lastPage: userBooks.lastPage })
      .from(userBooks)
      .where(and(eq(userBooks.userId, user.id), eq(userBooks.bookId, bookId)))
      .limit(1);

    return NextResponse.json(progress || { progress: 0, lastPage: 0 });
  } catch (error) {
    console.error("[GET /api/users/book-progress]", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
