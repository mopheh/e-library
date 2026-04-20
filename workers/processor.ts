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
      let downloadUrl = book.fileUrl;
      
      if (downloadUrl.includes("backblazeb2.com") || downloadUrl.includes("univault-books")) {
        const { authorizeB2, b2 } = await import("@/lib/utils");
        await authorizeB2();
      
        const urlObj = new URL(downloadUrl);
        const parts = urlObj.pathname.split("/");
        const bucketIndex = parts.indexOf("univault-books");
        const fileName = (bucketIndex !== -1 && bucketIndex + 1 < parts.length)
          ? parts.slice(bucketIndex + 1).join("/")
          : parts.pop() || "";

        const { data: auth } = await b2.getDownloadAuthorization({
          bucketId: process.env.B2_BUCKET_ID!,
          fileNamePrefix: fileName,
          validDurationInSeconds: 60 * 60,
        });

        downloadUrl = `${downloadUrl}?Authorization=${auth.authorizationToken}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 600000); // 10 minute timeout (600s)

      try {
        const res = await fetch(downloadUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);

        if (!res.body) throw new Error("Response body is null");

        const fileStream = fs.createWriteStream(tmpPath);
        await new Promise<void>((resolve, reject) => {
          res.body!.pipe(fileStream);
          res.body!.on("error", (err: any) => {
             console.error(`Page stream error: ${err.message}`);
             reject(err);
          });
          fileStream.on("finish", () => resolve());
        });
      } finally {
        clearTimeout(timeout);
      }

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
