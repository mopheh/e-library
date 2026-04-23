// /app/api/users/book-count/route.ts
// Marks a book as "read" (increments readCount) after the user spends 2+ minutes on it.

import { db } from "@/database/drizzle";
import { userBooks, users } from "@/database/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bookCountSchema = z.object({
  bookId: z.string().uuid("bookId must be a valid UUID"),
});

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = bookCountSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { bookId } = result.data;

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [existing] = await db
      .select({ id: userBooks.id, readCount: userBooks.readCount })
      .from(userBooks)
      .where(and(eq(userBooks.userId, user.id), eq(userBooks.bookId, bookId)))
      .limit(1);

    if (existing) {
      await db
        .update(userBooks)
        .set({ readCount: (existing.readCount ?? 0) + 1, updatedAt: new Date() })
        .where(eq(userBooks.id, existing.id));
    } else {
      await db.insert(userBooks).values({ userId: user.id, bookId, readCount: 1 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/users/book-count]", error);
    return NextResponse.json({ error: "Failed to update read count" }, { status: 500 });
  }
}
