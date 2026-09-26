import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { lagosHour } from "@/lib/time";
import { pruneReminderLog, sendScheduledReminders } from "@/lib/reminders";
import { checkExpiringScholarships, processEmailJobs, sweepOrphanedB2Uploads } from "@/lib/scheduled-tasks";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One heartbeat for all the light background work, so none of it depends on
// an always-on worker. Call it every 10-15 minutes from any scheduler
// (cron-job.org, Vercel Cron, ...) with `Authorization: Bearer $CRON_SECRET`.
// Every task is safe to repeat: reminders and scholarship claims are deduped
// in the DB, and email jobs are claimed with SKIP LOCKED.
//
// Heavy PDF parsing / question generation stays in the worker
// (`npm run worker`), which can be run by hand.
function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Daily housekeeping runs during the 3 AM (Lagos) hour.
const DAILY_HOUR = 3;

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks: Record<string, () => Promise<unknown>> = {
    reminders: sendScheduledReminders,
    // enqueue first so this tick can already send what it just found
    scholarshipDeadlines: checkExpiringScholarships,
    emailJobs: processEmailJobs,
  };
  if (lagosHour() === DAILY_HOUR) {
    tasks.pruneReminderLog = pruneReminderLog;
    tasks.b2Sweep = sweepOrphanedB2Uploads;
  }

  // Sequential so a slow task can't starve the DB for the others; each one
  // is isolated so a failure doesn't skip the rest.
  const results: Record<string, unknown> = {};
  let ok = true;
  for (const [name, task] of Object.entries(tasks)) {
    try {
      results[name] = (await task()) ?? "ok";
    } catch (error) {
      ok = false;
      results[name] = "failed";
      Sentry.captureException(error, { tags: { cronTask: name } });
      console.error(`[cron/tick] ${name} failed:`, error);
    }
  }

  return NextResponse.json({ ok, results }, { status: ok ? 200 : 500 });
}

// Vercel Cron sends GET; external schedulers can use either.
export const GET = run;
export const POST = run;
