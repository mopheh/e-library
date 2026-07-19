import { db } from "@/database/drizzle";
import { books, bookPages, jobs } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;

  const [book] = await db.select().from(books).where(eq(books.id, bookId));

  if (!book?.fileUrl) {
    return NextResponse.json({ error: "No PDF found" }, { status: 400 });
  }

  try {
    // Clear out previously parsed pages
    await db.delete(bookPages).where(eq(bookPages.bookId, bookId));

    // Dispatch to background processing worker queue
    await db.insert(jobs).values({
      type: "parse_book",
      payload: { bookId },
      status: "pending",
    });

    await db
      .update(books)
      .set({
        parseStatus: "processing",
        needsReview: false, // Reset needsReview status upon reparse
      })
      .where(eq(books.id, bookId));

    return NextResponse.json({ success: true, message: "Reparsing started in the background" }, { status: 202 });
  } catch (error) {
    console.error("Failed to enqueue reparse job:", error);
    return NextResponse.json({ error: "Job dispatch failed" }, { status: 500 });
  }
}
