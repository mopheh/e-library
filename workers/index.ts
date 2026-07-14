import "./bootstrap";
import { eq, sql, and, isNull, lt, SQL, desc, or } from "drizzle-orm";
import { processJob } from "./processor";
import { jobs, books } from "@/database/schema";
import { db } from "./db";
import { JobPayload } from "@/types";
export const JOB_TYPES = ["parse_book", "generate_questions"] as const;
export type JobType = (typeof JOB_TYPES)[number];

const POLL_INTERVAL = 3000;

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchNextJob() {
  const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

  return db.transaction(async (tx) => {
    // 1. Check for pending jobs OR stale processing jobs
    // SKIP LOCKED lets multiple worker processes dequeue concurrently without
    // racing to grab the same row - each transaction skips rows already
    // locked by another in-flight worker instead of blocking or double-picking.
    const [job] = await tx
      .select()
      .from(jobs)
      .where(
        and(
          or(
            eq(jobs.status, "pending"),
            and(
              eq(jobs.status, "processing"),
              sql`${jobs.lockedAt} < ${new Date(Date.now() - STALE_THRESHOLD_MS)}`
            )
          ),
          lt(jobs.attempts, jobs.maxAttempts)
        )
      )
      .orderBy(desc(jobs.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!job) return null;

    // Log if it's a recovery
    if (job.status === "processing") {
      console.log(`🔄 Recovering stale job ${job.id} (locked at ${job.lockedAt})`);
    }

    await tx
      .update(jobs)
      .set({
        status: "processing",
        lockedAt: new Date(),
        attempts: sql`${jobs.attempts} + 1`,
      })
      .where(eq(jobs.id, job.id));

    return job;
  });
}

async function run() {
  console.log("🟢 Worker started");

  while (true) {
    let job;
    try {
      job = await fetchNextJob();
    } catch (err: any) {
      // A transient DB blip here must not take down the whole worker process -
      // there's no supervisor restarting it, so this is the only line of
      // defense against a permanently-dead job queue.
      console.error("⚠️ Failed to fetch next job, will retry:", err.message);
      await sleep(POLL_INTERVAL);
      continue;
    }

    if (!job) {
      await sleep(POLL_INTERVAL);
      continue;
    }

    try {
      await processJob({
        id: job.id,
        type: job.type as JobType,
        payload: job.payload as JobPayload,
        attempts: job.attempts + 1,
        maxAttempts: job.maxAttempts,
      });
      await db
        .update(jobs)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      console.log(`✅ Job ${job.id} completed`);
    } catch (err: any) {
      console.error(`❌ Job ${job.id} encountered an error:`, err.message);

      try {
        const failed = (job.attempts + 1) >= job.maxAttempts;

        await db
          .update(jobs)
          .set({
            status: failed ? "failed" : "pending",
            lastError: err.message,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        if (failed) {
          console.error(`💀 Job ${job.id} has reached max attempts and marked as FAILED.`);
          // Otherwise the book stays stuck on "parsing"/"generating_questions"
          // forever - hooks/useBooks.ts polls indefinitely on those statuses,
          // so the admin UI would never surface the failure.
          const bookId = (job.payload as JobPayload)?.bookId;
          if (bookId) {
            await db
              .update(books)
              .set({ parseStatus: "failed" })
              .where(eq(books.id, bookId));
          }
        } else {
          console.log(`⏳ Job ${job.id} set back to pending for retry.`);
          // Small exponential backoff so an immediate retry doesn't just hit
          // the same transient failure again (e.g. an AI-provider rate limit).
          await sleep(Math.min(30000, 2 ** (job.attempts + 1) * 1000));
        }
      } catch (dbErr: any) {
        console.error(`⚠️ Failed to update job status in DB after error: ${dbErr.message}`);
        // We don't throw here to avoid crashing the whole worker loop
      }
    }
  }
}

run().catch((err) => {
  console.error("Worker crashed:", err);
  process.exit(1);
});
