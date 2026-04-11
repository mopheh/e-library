import { db } from "@/database/drizzle";
import { books, jobs } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;

  const [book] = await db.select().from(books).where(eq(books.id, bookId));

  if (!book?.fileUrl) {
    return NextResponse.json({ error: "No PDF found" }, { status: 400 });
  }

  try {
    // Dispatch to background processing worker queue
    await db.insert(jobs).values({
      type: "parse_book",
      payload: { bookId },
      status: "pending",
    });

    await db
      .update(books)
      .set({
        parseStatus: "processing"
      })
      .where(eq(books.id, bookId));

    return NextResponse.json({ success: true, message: "Parsing started in the background" }, { status: 202 });
  } catch (error) {
    console.error("Failed to enqueue parse job:", error);
    return NextResponse.json({ error: "Job dispatch failed" }, { status: 500 });
  }
}
