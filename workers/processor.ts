import { books, jobs } from "@/database/schema";
import { JobPayload, JobType } from "@/types";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { parsePdfPages } from "@/actions/parseBook";
import { generateQuestionsFromBook } from "@/lib/generateQuestions";

export async function processJob(job: {
  id: string;
  type: JobType;
  payload: JobPayload;
  attempts: number;
  maxAttempts: number;
}) {
  const { bookId } = job.payload;

  if (job.type === "parse_book") {
    await db
      .update(books)
      .set({ parseStatus: "parsing" })
      .where(eq(books.id, bookId));

    const [book] = await db.select().from(books).where(eq(books.id, bookId));

    if (!book?.fileUrl) {
      throw new Error(`Book ${bookId} has no fileUrl`);
    }

    const res = await fetch(book.fileUrl);
    const buffer = Buffer.from(await res.arrayBuffer());

    const pageCount = await parsePdfPages(buffer, bookId);

    await db
      .update(books)
      .set({ parseStatus: "parsed", pageCount })
      .where(eq(books.id, bookId));

    // enqueue next job
    await db.insert(jobs).values({
      type: "generate_questions",
      payload: { bookId },
    });

    return;
  }

  if (job.type === "generate_questions") {
    await db
      .update(books)
      .set({ parseStatus: "generating_questions" })
      .where(eq(books.id, bookId));

    await generateQuestionsFromBook(bookId);

    await db
      .update(books)
      .set({ parseStatus: "completed" })
      .where(eq(books.id, bookId));

    return;
  }

  throw new Error(`Unknown job type: ${job.type}`);
}
