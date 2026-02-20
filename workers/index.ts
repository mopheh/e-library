import "./bootstrap";
import { eq, sql, and, isNull, lt, SQL } from "drizzle-orm";
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
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "pending"),
          sql`${jobs.attempts} < ${jobs.maxAttempts}`,
        ),
      )
      .limit(1);

    if (!job) return null;

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
        attempts: job.attempts,
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
      const failed = job.attempts >= job.maxAttempts;

      await db
        .update(jobs)
        .set({
          status: failed ? "failed" : "pending",
          lastError: err.message,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      console.error(
        `❌ Job ${job.id} ${failed ? "failed" : "will retry"}:`,
        err.message,
      );
    }
  }
}

run().catch((err) => {
  console.error("Worker crashed:", err);
  process.exit(1);
});
