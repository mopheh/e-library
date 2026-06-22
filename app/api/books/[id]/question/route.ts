import { generateQuestionsFromBook } from "@/lib/generateQuestions";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only admins and faculty reps may trigger generation
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN" && user.role !== "FACULTY REP") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: bookId } = await params;

  // Mark as generating so the UI badge updates immediately
  await db
    .update(books)
    .set({ parseStatus: "generating_questions" })
    .where(eq(books.id, bookId));

  try {
    await generateQuestionsFromBook(bookId);

    await db
      .update(books)
      .set({ parseStatus: "completed" })
      .where(eq(books.id, bookId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Mark as failed so the admin can see something went wrong
    await db
      .update(books)
      .set({ parseStatus: "failed" })
      .where(eq(books.id, bookId));

    console.error("[POST /api/books/[id]/question]", err);
    return NextResponse.json(
      { error: err.message || "Question generation failed" },
      { status: 500 }
    );
  }
}
