import { books, jobs } from "@/database/schema";
import { JobPayload, JobType } from "@/types";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { parsePdfPages } from "@/actions/parseBook";
import { generateQuestionsFromBook } from "@/lib/generateQuestions";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import fetch from "node-fetch";

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

    const tmpPath = path.join(os.tmpdir(), `book_${bookId}_${Date.now()}.pdf`);

    try {
      const res = await fetch(book.fileUrl);
      if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.statusText}`);
      
      if (!res.body) throw new Error("Response body is null");
      
      const fileStream = fs.createWriteStream(tmpPath);
      await new Promise<void>((resolve, reject) => {
        res.body!.pipe(fileStream);
        res.body!.on("error", reject);
        fileStream.on("finish", () => resolve());
      });

      const pageCount = await parsePdfPages(tmpPath, bookId);

      await db
        .update(books)
        .set({ parseStatus: "parsed", pageCount })
        .where(eq(books.id, bookId));

      // enqueue next job
      await db.insert(jobs).values({
        type: "generate_questions",
        payload: { bookId },
      });
    } finally {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }

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
