import { parsePdfPages } from "@/actions/parseBook";
import { db } from "@/database/drizzle";
import { bookPages, books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;

  const [book] = await db.select().from(books).where(eq(books.id, bookId));

  if (!book?.fileUrl) {
    return NextResponse.json({ error: "No PDF found" }, { status: 400 });
  }

  const res = await fetch(book.fileUrl);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const numPages = await parsePdfPages(buffer, bookId);

  await db
    .update(books)
    .set({
      parseStatus: "completed",
      pageCount: numPages,
    })
    .where(eq(books.id, bookId));

  return NextResponse.json({ success: true });
}
