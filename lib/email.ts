import { Resend } from "resend";
import { opportunities, users, studentCourses, courses } from "@/database/schema";
import { eq, inArray, and, gte, lte, isNotNull } from "drizzle-orm";
import { differenceInDays } from "date-fns";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@/database/schema";
import type { CreateEmailOptions } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM;
const APP_BASE_URL = process.env.APP_BASE_URL ?? "";
const SIGN_IN_URL = `${APP_BASE_URL}${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}`;
const LOGO_URL = `${APP_BASE_URL}/rcf-logo-full.png`;

// Resend's batch.send accepts at most 100 emails per call; pace calls to stay
// comfortably under its default rate limit.
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 600;

// Same "closest upcoming exam within 14 days" window used by the dashboard's
// ExamPrepBanner (components/Dashboard/ExamPrepBanner.tsx), so the email and
// the in-app banner never disagree about whether a student is "in exam mode".
const EXAM_LOOKAHEAD_DAYS = 14;

// Brand palette lifted from public/rcf-logo-full.png (navy + gold crest).
const NAVY = "#16324A";
const NAVY_DARK = "#0E2333";
const GOLD = "#C9A227";
const CREAM = "#F7F3E9";
const INK = "#1F2A33";
const MUTED = "#5B6672";
const HAIRLINE = "#EAE3D2";

type NearestExam = { courseCode: string; daysToExam: number };

// Shared chrome (header/footer/centering table) so every email reads as one
// family. Body content is handed in pre-rendered; only the frame lives here.
function renderEmailLayout(opts: { preheader: string; bodyHtml: string }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RCF E-Library</title>
  </head>
  <body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${opts.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${HAIRLINE};">
            <tr>
              <td align="center" style="background:linear-gradient(135deg,${NAVY} 0%,${NAVY_DARK} 100%);padding:28px 24px;">
                <img src="${LOGO_URL}" alt="RCF E-Library" height="34" style="height:34px;width:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:${CREAM};border-top:1px solid ${HAIRLINE};">
                <p style="margin:0 0 4px;color:${MUTED};font-size:13px;">RCF E-Library &mdash; built for students, by students.</p>
                <p style="margin:0;color:${MUTED};font-size:12px;">You're receiving this because you have an account on RCF E-Library.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildButton(label: string, url: string, variant: "solid" | "outline" = "solid") {
  const style =
    variant === "solid"
      ? `background:${NAVY};color:#ffffff;border:1px solid ${NAVY};`
      : `background:#ffffff;color:${NAVY};border:1px solid ${NAVY};`;
  return `<a href="${url}" style="display:inline-block;${style}text-decoration:none;padding:11px 22px;border-radius:999px;font-weight:600;font-size:14px;">${label}</a>`;
}

function buildExamCountdownHtml(exam: NearestExam | null) {
  if (!exam) return "";
  const dayLabel =
    exam.daysToExam === 0 ? "today" : exam.daysToExam === 1 ? "in 1 day" : `in ${exam.daysToExam} days`;

  return `
    <div style="background:${CREAM};border-left:3px solid ${GOLD};border-radius:10px;padding:14px 18px;margin:0 0 20px;">
      <p style="margin:0;color:${NAVY};font-weight:700;font-size:14px;">Your ${exam.courseCode} exam is ${dayLabel}.</p>
      <p style="margin:4px 0 0;color:${MUTED};font-size:13px;">Hope your revision is going well &mdash; keep at it!</p>
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
    ? `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;">Application deadline: <strong style="color:${INK};">${opts.deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></p>`
    : "";
  const examBlock = buildExamCountdownHtml(opts.exam);
  const scholarshipIntro = opts.exam
    ? "In between study sessions, here's a new scholarship opportunity worth a look:"
    : "A new scholarship opportunity was just posted on RCF E-Library:";

  const bodyHtml = `
    <p style="margin:0 0 16px;color:${INK};font-size:15px;">Hi ${firstName},</p>
    ${examBlock}
    <p style="margin:0 0 18px;color:${INK};font-size:15px;">${scholarshipIntro}</p>
    <div style="border:1px solid ${HAIRLINE};border-radius:14px;padding:22px;margin:0 0 22px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${INK};">${opts.title}</p>
      <p style="margin:0 0 14px;color:${MUTED};font-size:14px;">${opts.company}</p>
      ${deadlineLine}
      ${buildButton("View &amp; Apply", opts.url)}
    </div>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">Log back in to RCF E-Library to see this and other opportunities curated for you.</p>
    ${buildButton("Log in to RCF E-Library", SIGN_IN_URL, "outline")}`;

  return renderEmailLayout({
    preheader: `${opts.title} at ${opts.company} was just posted on RCF E-Library.`,
    bodyHtml,
  });
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

  const bodyHtml = `
    <p style="margin:0 0 16px;color:${INK};font-size:15px;">Hi ${firstName},</p>
    ${examBlock}
    <p style="margin:0 0 18px;color:${INK};font-size:15px;">${scholarshipIntro}</p>
    <div style="border:1px solid ${HAIRLINE};border-radius:14px;padding:22px;margin:0 0 22px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${INK};">${opts.title}</p>
      <p style="margin:0 0 14px;color:${MUTED};font-size:14px;">${opts.company}</p>
      <p style="margin:0 0 16px;color:${MUTED};font-size:14px;">Application deadline: <strong style="color:#8a6d00;">${deadlineStr}</strong></p>
      ${buildButton("View &amp; Apply", opts.url)}
    </div>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;">Log back in to RCF E-Library to see this and other opportunities curated for you.</p>
    ${buildButton("Log in to RCF E-Library", SIGN_IN_URL, "outline")}`;

  return renderEmailLayout({
    preheader: `The application deadline for ${opts.title} is coming up in 7 days.`,
    bodyHtml,
  });
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
        ? `<p style="margin:0 0 12px;color:${MUTED};font-size:13px;">Deadline: <strong style="color:#8a6d00;">${opp.deadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong></p>`
        : "";
      return `
      <div style="border:1px solid ${HAIRLINE};border-radius:14px;padding:18px;margin:0 0 14px;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${INK};">${opp.title}</p>
        <p style="margin:0 0 10px;color:${MUTED};font-size:14px;">${opp.company}</p>
        ${deadlineLine}
        <a href="${opp.url}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;padding:9px 18px;border-radius:999px;font-weight:600;font-size:13px;">View &amp; Apply</a>
      </div>`;
    })
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 16px;color:${INK};font-size:15px;">Hi ${firstName},</p>
    ${examBlock}
    <p style="margin:0 0 20px;color:${INK};font-size:15px;">${digestIntro}</p>
    ${cards}
    <p style="margin:6px 0 20px;color:${MUTED};font-size:14px;">Log back in to RCF E-Library to see these and other opportunities curated for you.</p>
    ${buildButton("Log in to RCF E-Library", SIGN_IN_URL, "outline")}`;

  return renderEmailLayout({
    preheader: `${opps.length} scholarship opportunities you may have missed on RCF E-Library.`,
    bodyHtml,
  });
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
