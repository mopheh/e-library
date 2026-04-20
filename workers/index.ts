import "./bootstrap";
import { eq, sql, and, isNull, lt, SQL, desc, or } from "drizzle-orm";
import { processJob } from "./processor";
import { jobs } from "@/database/schema";
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
      .limit(1);

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
    const job = await fetchNextJob();

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
        } else {
          console.log(`⏳ Job ${job.id} set back to pending for retry.`);
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
