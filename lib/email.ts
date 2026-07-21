import { Resend } from "resend";
import { opportunities, users } from "@/database/schema";
import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/database/schema";
import type { CreateEmailOptions } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM;
const SIGN_IN_URL = `${process.env.APP_BASE_URL ?? ""}${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}`;

// Resend's batch.send accepts at most 100 emails per call; pace calls to stay
// comfortably under its default rate limit.
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 600;

function buildScholarshipEmailHtml(opts: {
  fullName: string;
  title: string;
  company: string;
  deadline: Date | null;
  url: string;
}) {
  const firstName = opts.fullName.split(" ")[0];
  const deadlineLine = opts.deadline
    ? `<p style="margin:0 0 16px;color:#555;">Application deadline: <strong>${opts.deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></p>`
    : "";

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 16px;">Hi ${firstName},</p>
    <p style="margin:0 0 16px;">A new scholarship opportunity was just posted on RCF E-Library:</p>
    <div style="border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;">${opts.title}</p>
      <p style="margin:0 0 12px;color:#666;">${opts.company}</p>
      ${deadlineLine}
      <a href="${opts.url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">View &amp; Apply</a>
    </div>
    <p style="margin:0 0 16px;color:#555;">Log back in to RCF E-Library to see this and other opportunities curated for you.</p>
    <a href="${SIGN_IN_URL}" style="display:inline-block;background:#fff;color:#111;border:1px solid #111;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Log in to RCF E-Library</a>
  </div>`;
}

function buildDigestEmailHtml(
  fullName: string,
  opps: { title: string; company: string; deadline: Date | null; url: string }[],
) {
  const firstName = fullName.split(" ")[0];
  const cards = opps
    .map((opp) => {
      const deadlineLine = opp.deadline
        ? `<p style="margin:0 0 10px;color:#555;font-size:14px;">Deadline: <strong>${opp.deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></p>`
        : "";
      return `
      <div style="border:1px solid #e5e5e5;border-radius:12px;padding:18px;margin:0 0 14px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;">${opp.title}</p>
        <p style="margin:0 0 10px;color:#666;font-size:14px;">${opp.company}</p>
        ${deadlineLine}
        <a href="${opp.url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:8px 16px;border-radius:8px;font-weight:600;font-size:14px;">View &amp; Apply</a>
      </div>`;
    })
    .join("");

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 16px;">Hi ${firstName},</p>
    <p style="margin:0 0 20px;">Here are ${opps.length} scholarship opportunities recently posted on RCF E-Library:</p>
    ${cards}
    <p style="margin:20px 0 16px;color:#555;">Log back in to RCF E-Library to see these and other opportunities curated for you.</p>
    <a href="${SIGN_IN_URL}" style="display:inline-block;background:#fff;color:#111;border:1px solid #111;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Log in to RCF E-Library</a>
  </div>`;
}

async function sendBatchedToStudents(
  db: NodePgDatabase<typeof schema>,
  subject: string,
  buildHtml: (fullName: string) => string,
) {
  const students = await db
    .select({ email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.role, "STUDENT"));

  if (students.length === 0) return;

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    try {
      await resend!.batch.send(
        batch.map((student) => ({
          from: EMAIL_FROM!,
          to: student.email,
          subject,
          html: buildHtml(student.fullName),
        })) as CreateEmailOptions[],
      );
    } catch (err) {
      // Best-effort: a partial failure here must not throw, since that would mark
      // the whole job "pending" for retry and re-send duplicate emails to students
      // already reached by earlier batches in this same run.
      console.error(`[email] Failed to send batch starting at ${i}:`, err);
    }

    if (i + BATCH_SIZE < students.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
}

export async function sendScholarshipEmails(
  opportunityId: string,
  db: NodePgDatabase<typeof schema>,
) {
  if (!resend || !EMAIL_FROM) {
    console.error(
      "[email] RESEND_API_KEY and/or EMAIL_FROM is not set - skipping scholarship notification email.",
    );
    return;
  }

  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId));

  if (!opportunity) {
    console.error(`[email] Opportunity ${opportunityId} not found - skipping notification email.`);
    return;
  }

  await sendBatchedToStudents(db, `New scholarship: ${opportunity.title}`, (fullName) =>
    buildScholarshipEmailHtml({
      fullName,
      title: opportunity.title,
      company: opportunity.company,
      deadline: opportunity.deadline,
      url: opportunity.url,
    }),
  );
}

// One-off (or occasional) backfill: notify students about several already-posted
// scholarships in a single digest email instead of one email per opportunity.
export async function sendScholarshipDigestEmail(
  opportunityIds: string[],
  db: NodePgDatabase<typeof schema>,
) {
  if (!resend || !EMAIL_FROM) {
    console.error("[email] RESEND_API_KEY and/or EMAIL_FROM is not set - skipping digest email.");
    return;
  }
  if (opportunityIds.length === 0) return;

  const opps = await db
    .select()
    .from(opportunities)
    .where(inArray(opportunities.id, opportunityIds));

  if (opps.length === 0) return;

  await sendBatchedToStudents(
    db,
    `${opps.length} scholarship opportunities you may have missed`,
    (fullName) => buildDigestEmailHtml(fullName, opps),
  );
}
