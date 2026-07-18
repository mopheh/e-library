import "./bootstrap";
import { eq, sql, and, isNull, lt, gte, SQL, desc, or } from "drizzle-orm";
import { processJob } from "./processor";
import { jobs, books } from "@/database/schema";
import { db } from "./db";
import { JobPayload } from "@/types";
export const JOB_TYPES = ["parse_book", "generate_questions"] as const;
export type JobType = (typeof JOB_TYPES)[number];

const POLL_INTERVAL = 3000;

// pg's Pool only attaches an error listener to idle clients - a client that's
// mid-query when the socket drops can emit 'error' after its query promise
// already rejected, with no listener left to catch it. Node's default for an
// unhandled 'error' event is to crash the process, which otherwise takes down
// this entire worker on a transient network blip with nothing to restart it.
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught exception (worker staying alive):", err.message);
});
process.on("unhandledRejection", (reason: any) => {
  console.error("⚠️ Unhandled rejection (worker staying alive):", reason?.message ?? reason);
});

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// fetchNextJob increments attempts before the job runs, so if the process
// dies mid-job (crash, OOM, redeploy) instead of throwing a catchable error,
// the row is left with attempts === maxAttempts but never reaches "failed" -
// and since dequeueing requires attempts < maxAttempts, it becomes invisible
// to the worker forever while its book stays stuck "parsing" in the UI. This
// sweep reclaims those orphans on startup and marks them (and their book) failed.
async function reapOrphanedJobs() {
  return db.transaction(async (tx) => {
    const orphans = await tx
      .select()
      .from(jobs)
      .where(
        and(or(eq(jobs.status, "pending"), eq(jobs.status, "processing")), gte(jobs.attempts, jobs.maxAttempts))
      )
      .for("update", { skipLocked: true });

    for (const job of orphans) {
      await tx
        .update(jobs)
        .set({
          status: "failed",
          lastError: job.lastError ?? "Job exhausted attempts without reaching a terminal status (worker crash recovery)",
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      const bookId = (job.payload as JobPayload)?.bookId;
      if (bookId) {
        await tx.update(books).set({ parseStatus: "failed" }).where(eq(books.id, bookId));
      }
    }

    if (orphans.length > 0) {
      console.error(`💀 Reaped ${orphans.length} orphaned job(s) stuck past max attempts.`);
    }
  });
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

  try {
    await reapOrphanedJobs();
  } catch (err: any) {
    console.error("⚠️ Failed to reap orphaned jobs on startup:", err.message);
  }

  // Also sweep periodically, not just on startup - if a *different* worker
  // instance crashes, this one may stay up for a long time without a restart
  // of its own to trigger the startup sweep above.
  setInterval(() => {
    reapOrphanedJobs().catch((err) => console.error("⚠️ Failed to reap orphaned jobs:", err.message));
  }, 10 * 60 * 1000);

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
      // Drizzle's node-postgres driver wraps the real pg error in `.cause` and
      // sets `.message` to a generic "Failed query: <sql>\nparams: <params>"
      // dump - for inserts with large params (e.g. book_pages embeddings) that
      // dump is hundreds of KB and the actual error reason never gets logged.
      const message = String(err?.cause?.message ?? err?.message ?? err).slice(0, 500);
      console.error(`❌ Job ${job.id} encountered an error:`, message);

      try {
        const failed = (job.attempts + 1) >= job.maxAttempts;

        await db
          .update(jobs)
          .set({
            status: failed ? "failed" : "pending",
            lastError: message,
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
