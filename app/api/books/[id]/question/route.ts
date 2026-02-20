import { generateQuestionsFromBook } from "@/lib/generateQuestions";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;

  await generateQuestionsFromBook(bookId);

  await db
    .update(books)
    .set({ parseStatus: "completed" })
    .where(eq(books.id, bookId));

  return NextResponse.json({ success: true });
}
