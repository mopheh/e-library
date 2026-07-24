import { books, jobs } from "@/database/schema";
import { JobPayload, JobType } from "@/types";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { parsePdfPages, parseDocxPages } from "@/actions/parseBook";
import { generateQuestionsFromBook } from "@/lib/generateQuestions";
import { sendScholarshipEmails, sendScholarshipReminderEmails } from "@/lib/email";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import fetch from "node-fetch";

// A book's `type` field is meant to distinguish past-question papers/
// handwritten notes from real study material, but uploads are frequently
// mistagged generically as "Material" regardless of actual content (58 such
// mistagged past-question papers were found sitting in a question-generation
// backlog). Title text is a much more reliable signal for this specific
// pattern, so match on both.
const SKIP_GENERATION_TYPES = ["past question", "past_question", "handwritten", "note"];
const SKIP_GENERATION_TITLE_PATTERNS = [/\bPQs?\b/i, /past\s*questions?/i];

function isSkipGenerationTypeOrTitle(book: { type: string; title: string }): boolean {
  const type = (book.type || "").toLowerCase();
  if (SKIP_GENERATION_TYPES.some((t) => type.includes(t))) return true;
  return SKIP_GENERATION_TITLE_PATTERNS.some((p) => p.test(book.title || ""));
}

// If most of a book's pages needed OCR review (see actions/parseBook.ts),
// it's effectively a handwritten/poor-scan document rather than one bad page
// in an otherwise-fine textbook - generating quiz questions from mostly
// unreadable/garbled source text just produces garbage output.
const POOR_OCR_SKIP_RATIO = 0.5;

export async function processJob(job: {
  id: string;
  type: JobType;
  payload: JobPayload;
  attempts: number;
  maxAttempts: number;
}) {
  if (job.type === "send_scholarship_email") {
    const { opportunityId } = job.payload as { opportunityId: string };
    await sendScholarshipEmails(opportunityId, db);
    return;
  }

  if (job.type === "send_scholarship_reminder_email") {
    const { opportunityId } = job.payload as { opportunityId: string };
    await sendScholarshipReminderEmails(opportunityId, db);
    return;
  }

  const { bookId } = job.payload as { bookId: string };

  if (job.type === "parse_book") {
    await db
      .update(books)
      .set({ parseStatus: "parsing" })
      .where(eq(books.id, bookId));

    const [book] = await db.select().from(books).where(eq(books.id, bookId));

    if (!book?.fileUrl) {
      throw new Error(`Book ${bookId} has no fileUrl`);
    }

    const isDocx = book.fileUrl.toLowerCase().includes(".docx") || book.fileUrl.toLowerCase().includes(".doc");
    const extension = isDocx ? ".docx" : ".pdf";
    const tmpPath = path.join(os.tmpdir(), `book_${bookId}_${Date.now()}${extension}`);

    try {
      let downloadUrl = book.fileUrl;
      
      // Normalize wrong cluster URL (f000 → f005)
      downloadUrl = downloadUrl.replace("https://f000.backblazeb2.com", "https://f005.backblazeb2.com");

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
          fileNamePrefix: decodeURIComponent(fileName),
          validDurationInSeconds: 60 * 60,
        });

        // B2 400s on reserved characters (e.g. "[", "]", raw spaces) left
        // unencoded in the path - filenames containing them are real uploads,
        // not edge cases. Decode-then-encode is idempotent whether the stored
        // fileUrl was already percent-encoded or not.
        let encodedPath = urlObj.pathname;
        try {
          encodedPath = decodeURIComponent(urlObj.pathname).split("/").map(encodeURIComponent).join("/");
        } catch {
          // malformed escape sequence in the stored URL - fall back to the original path
        }

        downloadUrl = `${urlObj.origin}${encodedPath}?Authorization=${auth.authorizationToken}`;
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

      let pageCount = 0;
      let needsReview = false;
      let needsReviewCount = 0;
      if (isDocx) {
        ({ numPages: pageCount, needsReview } = await parseDocxPages(tmpPath, bookId));
      } else {
        ({ numPages: pageCount, needsReview, needsReviewCount } = await parsePdfPages(tmpPath, bookId));
      }

      if (needsReview) {
        console.log(`⚠️ Book ${bookId} has low-confidence OCR page(s) - flagging for manual review.`);
      }

      const isPoorOcr = pageCount > 0 && needsReviewCount / pageCount >= POOR_OCR_SKIP_RATIO;
      const shouldSkip = isSkipGenerationTypeOrTitle(book) || isPoorOcr;

      if (shouldSkip) {
        const reason = isPoorOcr
          ? `poor OCR quality - ${needsReviewCount}/${pageCount} pages needed review (likely handwritten)`
          : `type/title match (Type: ${book.type}, Title: ${book.title})`;
        console.log(`⏭️ Skipping question generation for book ${bookId} (${reason})`);
        await db
          .update(books)
          .set({ parseStatus: "completed", pageCount, needsReview })
          .where(eq(books.id, bookId));
      } else {
        // Auto-chain straight into question generation instead of leaving the
        // book parked at "parsed" waiting for an admin to click "Generate
        // Questions" - from the uploader's point of view, parsing and
        // generation are one pipeline. RAG/AI-chat is already usable as soon
        // as parsing lands (pages/embeddings are written by parsePdfPages
        // above), so this doesn't delay that.
        await db.insert(jobs).values({
          type: "generate_questions",
          payload: { bookId },
          status: "pending",
        });
        await db
          .update(books)
          .set({ parseStatus: "generating_questions", pageCount, needsReview })
          .where(eq(books.id, bookId));
      }
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
