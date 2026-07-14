import { db } from "@/database/drizzle";
import { books, jobs } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Question generation runs a long AI loop per page-batch (with mandatory
// rate-limit sleeps between batches - see lib/generateQuestions.ts), so it's
// dispatched to the background job queue (the same worker process that
// already handles "generate_questions" jobs, see workers/processor.ts)
// instead of being awaited inline here. Running it inline would hold a
// serverless function open for minutes on any reasonably sized book and
// risks hitting the platform's execution time limit under concurrent use.
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

  try {
    // Dispatch to background processing worker queue
    await db.insert(jobs).values({
      type: "generate_questions",
      payload: { bookId },
      status: "pending",
    });

    // Mark as generating so the UI badge updates immediately
    await db
      .update(books)
      .set({ parseStatus: "generating_questions" })
      .where(eq(books.id, bookId));

    return NextResponse.json(
      { success: true, message: "Question generation started in the background" },
      { status: 202 }
    );
  } catch (err: any) {
    console.error("[POST /api/books/[id]/question]", err);
    return NextResponse.json(
      { error: err.message || "Failed to enqueue question generation" },
      { status: 500 }
    );
  }
}
