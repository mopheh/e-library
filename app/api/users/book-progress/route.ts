import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/database/drizzle";
import { users, userBooks } from "@/database/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId, progress, lastPage } = await req.json();

    if (!bookId) {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    // Find internal user ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update progress in userBooks table
    await db
      .insert(userBooks)
      .values({
        userId: user.id,
        bookId: bookId,
        progress: progress || 0,
        lastPage: lastPage || 0,
        lastReadAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userBooks.userId, userBooks.bookId],
        set: {
          progress: progress || 0,
          lastPage: lastPage || 0,
          lastReadAt: new Date(),
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/users/book-progress]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update progress" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
    try {
      const { userId: clerkId } = await auth();
      if (!clerkId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const { searchParams } = new URL(req.url);
      const bookId = searchParams.get("bookId");
  
      if (!bookId) {
        return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
      }
  
      // Find internal user ID
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);
  
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
  
      const [progress] = await db
        .select({
           progress: userBooks.progress,
           lastPage: userBooks.lastPage
        })
        .from(userBooks)
        .where(
            and(
                eq(userBooks.userId, user.id),
                eq(userBooks.bookId, bookId)
            )
        )
        .limit(1);
  
      return NextResponse.json(progress || { progress: 0, lastPage: 0 });
    } catch (error: any) {
      console.error("[GET /api/users/book-progress]", error);
      return NextResponse.json(
        { error: error?.message || "Failed to fetch progress" },
        { status: 500 }
      );
    }
}
