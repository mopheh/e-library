import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/database/drizzle";
import { books, jobs, opportunities, semesterResults, verificationRequests } from "@/database/schema";
import { b2KeyFromUrl, deleteB2Key, listB2ObjectsOlderThan } from "@/lib/b2-delete";
import { sendScholarshipEmails, sendScholarshipReminderEmails } from "@/lib/email";

// Everything the background worker used to do on a timer that ISN'T heavy
// PDF/AI work. These run from GET /api/cron/tick (hit by an external
// scheduler), so they keep working without an always-on worker process.
// The worker (npm run worker) now only handles parse_book /
// generate_questions jobs, and can be run by hand when uploads need processing.

export const EMAIL_JOB_TYPES = ["send_scholarship_email", "send_scholarship_reminder_email"] as const;

// A job left "processing" longer than this was cut off mid-run (function
// timeout, deploy) and is safe to pick up again.
const STALE_LOCK_MS = 10 * 60 * 1000;
const EMAIL_JOBS_PER_TICK = 5;

/**
 * Claims up to EMAIL_JOBS_PER_TICK pending email jobs and sends them. The
 * claim is a single UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP
 * LOCKED), so overlapping ticks never send the same job twice.
 */
export async function processEmailJobs() {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);

  // A job cut off during its last allowed attempt can never be claimed
  // again - close it out instead of leaving it "processing" forever.
  await db
    .update(jobs)
    .set({ status: "failed", lastError: "Interrupted on final attempt", updatedAt: new Date() })
    .where(
      and(
        inArray(jobs.type, [...EMAIL_JOB_TYPES]),
        eq(jobs.status, "processing"),
        sql`${jobs.lockedAt} < ${staleBefore}`,
        sql`${jobs.attempts} >= ${jobs.maxAttempts}`,
      ),
    );

  const claimed = await db
    .update(jobs)
    .set({ status: "processing", lockedAt: new Date(), attempts: sql`${jobs.attempts} + 1`, updatedAt: new Date() })
    .where(
      inArray(
        jobs.id,
        db
          .select({ id: jobs.id })
          .from(jobs)
          .where(
            and(
              inArray(jobs.type, [...EMAIL_JOB_TYPES]),
              sql`${jobs.attempts} < ${jobs.maxAttempts}`,
              sql`(${jobs.status} = 'pending' or (${jobs.status} = 'processing' and ${jobs.lockedAt} < ${staleBefore}))`,
            ),
          )
          .orderBy(jobs.createdAt)
          .limit(EMAIL_JOBS_PER_TICK)
          .for("update", { skipLocked: true }),
      ),
    )
    .returning();

  for (const job of claimed) {
    const { opportunityId } = job.payload as { opportunityId: string };
    try {
      if (job.type === "send_scholarship_email") {
        await sendScholarshipEmails(opportunityId, db);
      } else {
        await sendScholarshipReminderEmails(opportunityId, db);
      }
      await db.update(jobs).set({ status: "completed", updatedAt: new Date() }).where(eq(jobs.id, job.id));
      console.log(`📧 Email job ${job.id} (${job.type}) completed`);
    } catch (err: any) {
      const failed = job.attempts >= job.maxAttempts; // attempts already incremented by the claim
      Sentry.captureException(err, { tags: { jobId: job.id, jobType: job.type, terminal: failed } });
      await db
        .update(jobs)
        .set({
          status: failed ? "failed" : "pending",
          lastError: String(err?.message ?? err).slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));
    }
  }
  return claimed.length;
}

// Finds SCHOLARSHIP opportunities whose deadline falls within the next 7 days
// and haven't had a reminder sent yet, and enqueues one reminder-email job per
// opportunity. The UPDATE...RETURNING atomically "claims" each row (sets
// reminderSentAt), so overlapping runs only enqueue once per opportunity.
const SCHOLARSHIP_REMINDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function checkExpiringScholarships() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + SCHOLARSHIP_REMINDER_WINDOW_MS);

  const claimed = await db
    .update(opportunities)
    .set({ reminderSentAt: now })
    .where(
      and(
        eq(opportunities.type, "SCHOLARSHIP"),
        isNull(opportunities.reminderSentAt),
        gte(opportunities.deadline, now),
        lte(opportunities.deadline, windowEnd),
      ),
    )
    .returning({ id: opportunities.id });

  if (claimed.length === 0) return 0;

  await db.insert(jobs).values(
    claimed.map((opp) => ({
      type: "send_scholarship_reminder_email",
      payload: { opportunityId: opp.id },
      status: "pending",
    })),
  );

  console.log(`📧 Enqueued ${claimed.length} scholarship deadline reminder email(s).`);
  return claimed.length;
}

// A client can get a presigned B2 upload URL, upload the file straight to
// B2, and then never call POST /api/books (or submit the verification form)
// to actually register it - abandoned form, network drop, etc. Nothing else
// ever points at that object, so left alone it sits in B2 forever, quietly
// costing storage. This sweep finds and removes those orphans.
const B2_ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000; // grace period - don't race an in-flight registration

export async function sweepOrphanedB2Uploads() {
  const cutoff = new Date(Date.now() - B2_ORPHAN_MIN_AGE_MS);
  // books/: book materials AND aspirant verification documents.
  // slips/: Grades-page result slips (uploaded, then never attached/saved).
  const candidates = [
    ...(await listB2ObjectsOlderThan("books/", cutoff)),
    ...(await listB2ObjectsOlderThan("slips/", cutoff)),
  ];
  if (candidates.length === 0) return 0;

  // Every table that can reference an uploaded object must be checked
  // before anything is deleted.
  const [bookRows, verificationRows, slipRows] = await Promise.all([
    db.select({ fileUrl: books.fileUrl }).from(books),
    db.select({ proofUrl: verificationRequests.proofUrl }).from(verificationRequests),
    db.select({ slipUrl: semesterResults.slipUrl }).from(semesterResults),
  ]);

  const referencedKeys = new Set<string>();
  for (const row of bookRows) {
    const key = row.fileUrl ? b2KeyFromUrl(row.fileUrl) : null;
    if (key) referencedKeys.add(key);
  }
  for (const row of verificationRows) {
    const key = b2KeyFromUrl(row.proofUrl);
    if (key) referencedKeys.add(key);
  }
  for (const row of slipRows) {
    const key = row.slipUrl ? b2KeyFromUrl(row.slipUrl) : null;
    if (key) referencedKeys.add(key);
  }

  const orphanKeys = candidates.map((c) => c.key).filter((key) => !referencedKeys.has(key));
  let deleted = 0;
  for (const key of orphanKeys) {
    try {
      await deleteB2Key(key);
      deleted++;
    } catch (err) {
      console.error(`⚠️ Failed to delete orphaned B2 object ${key}:`, err);
      Sentry.captureException(err);
    }
  }

  if (orphanKeys.length) {
    console.log(`🧹 Swept ${deleted}/${orphanKeys.length} orphaned B2 upload(s) (uploaded but never registered).`);
  }
  return deleted;
}
