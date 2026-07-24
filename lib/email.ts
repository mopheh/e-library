import { Resend } from "resend";
import { opportunities, users, studentCourses, courses } from "@/database/schema";
import { eq, inArray, and, gte, lte, isNotNull } from "drizzle-orm";
import { differenceInDays } from "date-fns";
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

// Same "closest upcoming exam within 14 days" window used by the dashboard's
// ExamPrepBanner (components/Dashboard/ExamPrepBanner.tsx), so the email and
// the in-app banner never disagree about whether a student is "in exam mode".
const EXAM_LOOKAHEAD_DAYS = 14;

type NearestExam = { courseCode: string; daysToExam: number };

function buildExamCountdownHtml(exam: NearestExam | null) {
  if (!exam) return "";
  const dayLabel =
    exam.daysToExam === 0 ? "today" : exam.daysToExam === 1 ? "in 1 day" : `in ${exam.daysToExam} days`;

  return `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;color:#9a3412;font-weight:600;">Your ${exam.courseCode} exam is ${dayLabel}.</p>
      <p style="margin:6px 0 0;color:#9a3412;font-size:14px;">Hope your revision is going well - keep at it!</p>
    </div>`;
}

// Looks up, for every student, the soonest exam (across their enrolled
// courses) landing within the next EXAM_LOOKAHEAD_DAYS days. One joined query
// for all students rather than one query per recipient.
async function getNearestExamsByUser(
  db: NodePgDatabase<typeof schema>,
): Promise<Map<string, NearestExam>> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + EXAM_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userId: studentCourses.userId,
      courseCode: courses.courseCode,
      examDate: courses.examDate,
    })
    .from(studentCourses)
    .innerJoin(courses, eq(studentCourses.courseId, courses.id))
    .where(and(isNotNull(courses.examDate), gte(courses.examDate, now), lte(courses.examDate, windowEnd)));

  const nearestByUser = new Map<string, NearestExam>();
  for (const row of rows) {
    if (!row.examDate) continue;
    const daysToExam = Math.max(0, differenceInDays(row.examDate, now));
    const existing = nearestByUser.get(row.userId);
    if (!existing || daysToExam < existing.daysToExam) {
      nearestByUser.set(row.userId, { courseCode: row.courseCode, daysToExam });
    }
  }
  return nearestByUser;
}

function buildScholarshipEmailHtml(opts: {
  fullName: string;
  title: string;
  company: string;
  deadline: Date | null;
  url: string;
  exam: NearestExam | null;
}) {
  const firstName = opts.fullName.split(" ")[0];
  const deadlineLine = opts.deadline
    ? `<p style="margin:0 0 16px;color:#555;">Application deadline: <strong>${opts.deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></p>`
    : "";
  const examBlock = buildExamCountdownHtml(opts.exam);
  const scholarshipIntro = opts.exam
    ? "In between study sessions, here's a new scholarship opportunity worth a look:"
    : "A new scholarship opportunity was just posted on RCF E-Library:";

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 16px;">Hi ${firstName},</p>
    ${examBlock}
    <p style="margin:0 0 16px;">${scholarshipIntro}</p>
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

function buildScholarshipReminderEmailHtml(opts: {
  fullName: string;
  title: string;
  company: string;
  deadline: Date;
  url: string;
  exam: NearestExam | null;
}) {
  const firstName = opts.fullName.split(" ")[0];
  const deadlineStr = opts.deadline.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const examBlock = buildExamCountdownHtml(opts.exam);
  const scholarshipIntro = opts.exam
    ? "Once you've got a study break, here's something else worth your attention - a scholarship deadline is coming up in 7 days:"
    : "Reminder: the application deadline for a scholarship on RCF E-Library is coming up in 7 days:";

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 16px;">Hi ${firstName},</p>
    ${examBlock}
    <p style="margin:0 0 16px;">${scholarshipIntro}</p>
    <div style="border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;">${opts.title}</p>
      <p style="margin:0 0 12px;color:#666;">${opts.company}</p>
      <p style="margin:0 0 16px;color:#555;">Application deadline: <strong>${deadlineStr}</strong></p>
      <a href="${opts.url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">View &amp; Apply</a>
    </div>
    <p style="margin:0 0 16px;color:#555;">Log back in to RCF E-Library to see this and other opportunities curated for you.</p>
    <a href="${SIGN_IN_URL}" style="display:inline-block;background:#fff;color:#111;border:1px solid #111;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Log in to RCF E-Library</a>
  </div>`;
}

function buildDigestEmailHtml(
  fullName: string,
  opps: { title: string; company: string; deadline: Date | null; url: string }[],
  exam: NearestExam | null,
) {
  const firstName = fullName.split(" ")[0];
  const examBlock = buildExamCountdownHtml(exam);
  const digestIntro = exam
    ? `Once you've got a study break, here are ${opps.length} scholarship opportunities recently posted on RCF E-Library:`
    : `Here are ${opps.length} scholarship opportunities recently posted on RCF E-Library:`;
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
    ${examBlock}
    <p style="margin:0 0 20px;">${digestIntro}</p>
    ${cards}
    <p style="margin:20px 0 16px;color:#555;">Log back in to RCF E-Library to see these and other opportunities curated for you.</p>
    <a href="${SIGN_IN_URL}" style="display:inline-block;background:#fff;color:#111;border:1px solid #111;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Log in to RCF E-Library</a>
  </div>`;
}

async function sendBatchedToStudents(
  db: NodePgDatabase<typeof schema>,
  subject: string,
  buildHtml: (fullName: string, exam: NearestExam | null) => string,
) {
  const students = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.role, "STUDENT"));

  if (students.length === 0) return;

  const nearestExamsByUser = await getNearestExamsByUser(db);

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    try {
      await resend!.batch.send(
        batch.map((student) => ({
          from: EMAIL_FROM!,
          to: student.email,
          subject,
          html: buildHtml(student.fullName, nearestExamsByUser.get(student.id) ?? null),
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

  await sendBatchedToStudents(db, `New scholarship: ${opportunity.title}`, (fullName, exam) =>
    buildScholarshipEmailHtml({
      fullName,
      title: opportunity.title,
      company: opportunity.company,
      deadline: opportunity.deadline,
      url: opportunity.url,
      exam,
    }),
  );
}

export async function sendScholarshipReminderEmails(
  opportunityId: string,
  db: NodePgDatabase<typeof schema>,
) {
  if (!resend || !EMAIL_FROM) {
    console.error(
      "[email] RESEND_API_KEY and/or EMAIL_FROM is not set - skipping scholarship reminder email.",
    );
    return;
  }

  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId));

  if (!opportunity || !opportunity.deadline) {
    console.error(`[email] Opportunity ${opportunityId} not found or has no deadline - skipping reminder email.`);
    return;
  }

  await sendBatchedToStudents(db, `Reminder: ${opportunity.title} deadline in 7 days`, (fullName, exam) =>
    buildScholarshipReminderEmailHtml({
      fullName,
      title: opportunity.title,
      company: opportunity.company,
      deadline: opportunity.deadline!,
      url: opportunity.url,
      exam,
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
    (fullName, exam) => buildDigestEmailHtml(fullName, opps, exam),
  );
}
