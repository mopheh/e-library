/**
 * Format rules for anything a regular user can contribute: material (book)
 * details and courses. Shared by the forms (inline errors while typing) and
 * the API / server actions (the real gate - the client can be bypassed).
 *
 * Keep this file free of server-only imports; it ships to the browser.
 */
import { z } from "zod";
import { BOOK_TYPES } from "@/lib/bookTypes";

export const COURSE_LEVELS = ["100", "200", "300", "400", "500", "600"] as const;
export const COURSE_SEMESTERS = ["FIRST", "SECOND"] as const;
export const MAX_COURSES_PER_MATERIAL = 5;

// ── Text checks ──────────────────────────────────────────────────────────────

const URL_RE = /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|net|org|ng|io|me|ly|co|info|xyz|app|link)\b/i;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// Nigerian / international phone numbers - the classic "WhatsApp me" spam.
const PHONE_RE = /(\+?234|\b0)[789][01]\d[\s-]?\d{3}[\s-]?\d{4}\b/;
const HTML_RE = /<[^>]*>|&[a-z]+;|&#\d+;/i;
const REPEAT_RE = /(\D)\1{4,}/; // "aaaaa", "!!!!!" (digits exempt: "2000000")
const LETTER_RE = /\p{L}/gu;

/** Collapses runs of whitespace and trims. */
export const tidy = (s: string) => s.replace(/\s+/g, " ").trim();

const TITLE_CHARS = /^[\p{L}\p{N} .,:;'"’()&\-–/+?!#]+$/u;
const DESCRIPTION_CHARS = /^[\p{L}\p{N}\s.,:;'"’“”()&\-–/+?!#%*\[\]]+$/u;

type TextRuleOpts = { label: string; min: number; max: number; minLetters: number; chars: RegExp };

function checkText(value: string, ctx: z.RefinementCtx, o: TextRuleOpts) {
  const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });

  if (value.length < o.min) return fail(`${o.label} must be at least ${o.min} characters`);
  if (value.length > o.max) return fail(`${o.label} must be ${o.max} characters or fewer`);
  if (HTML_RE.test(value)) return fail(`${o.label} can't contain HTML or code`);
  if (EMAIL_RE.test(value)) return fail(`${o.label} can't contain email addresses`);
  if (URL_RE.test(value)) return fail(`${o.label} can't contain links or web addresses`);
  if (PHONE_RE.test(value)) return fail(`${o.label} can't contain phone numbers`);
  if (!o.chars.test(value)) return fail(`${o.label} has characters that aren't allowed (emoji or symbols)`);
  if (REPEAT_RE.test(value)) return fail(`${o.label} has too many repeated characters`);
  if ((value.match(LETTER_RE)?.length ?? 0) < o.minLetters) return fail(`${o.label} needs real words, not just numbers or symbols`);
}

// ── Material (book) details ──────────────────────────────────────────────────

export const materialTitleSchema = z
  .string({ required_error: "Title is required" })
  .transform(tidy)
  .superRefine((v, ctx) => checkText(v, ctx, { label: "Title", min: 5, max: 120, minLetters: 4, chars: TITLE_CHARS }));

export const materialDescriptionSchema = z
  .string({ required_error: "Description is required" })
  .transform((s) => s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim())
  .superRefine((v, ctx) => {
    checkText(v, ctx, { label: "Description", min: 20, max: 1000, minLetters: 15, chars: DESCRIPTION_CHARS });
    if (v.split(/\s+/).filter(Boolean).length < 4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Description should be at least a short sentence" });
    }
  });

export const materialTypeSchema = z.enum(BOOK_TYPES, {
  errorMap: () => ({ message: "Pick a resource type" }),
});

export const materialCourseIdsSchema = z
  .array(z.string().uuid("Invalid course"))
  .min(1, "Select at least one course")
  .max(MAX_COURSES_PER_MATERIAL, `Select at most ${MAX_COURSES_PER_MATERIAL} courses`)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate course selected");

/** The user-editable details of a material, as the upload form sends them. */
export const materialDetailsSchema = z.object({
  title: materialTitleSchema,
  description: materialDescriptionSchema,
  type: materialTypeSchema,
  departmentId: z.string({ required_error: "Select a department" }).uuid("Select a department"),
  courseIds: materialCourseIdsSchema,
});

// ── Courses ──────────────────────────────────────────────────────────────────

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);

/** "INTRODUCTION TO PHYSICS" / "introduction to physics" → "Introduction to Physics". Mixed case is left alone. */
export function normalizeCourseTitle(raw: string) {
  const s = tidy(raw);
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    // Roman numerals ("Physics ii") stay upper case.
    .map((w) => (/^(i|ii|iii|iv|v|vi)$/i.test(w) ? w.toUpperCase() : w))
    .join(" ");
}

/** Strips separators and upper-cases: "csc 201" → "CSC201". For comparing codes, not storing them. */
export const courseCodeKey = (raw: string) => raw.replace(/[\s\-_.]+/g, "").toUpperCase();

/**
 * The platform's stored format, letters then a space then digits:
 * "csc201" / "CSC-201" / "csc  201" → "CSC 201". Anything that doesn't split
 * cleanly is returned as its key so validation can reject it.
 */
export function normalizeCourseCode(raw: string) {
  const key = courseCodeKey(raw);
  const m = key.match(/^([A-Z]+)(\d+)$/);
  return m ? `${m[1]} ${m[2]}` : key;
}

/** The level a code implies from its first digit: CSC 201 → "200". */
export function levelFromCode(code: string): (typeof COURSE_LEVELS)[number] | null {
  const m = courseCodeKey(code).match(/^[A-Z]{3,4}([1-6])\d{2}$/);
  return m ? (`${m[1]}00` as (typeof COURSE_LEVELS)[number]) : null;
}

export const courseCodeSchema = z
  .string({ required_error: "Course code is required" })
  .transform(normalizeCourseCode)
  .pipe(
    z
      .string()
      .min(1, "Course code is required")
      .regex(/^[A-Z]{3,4} \d{3}$/, "Use the official format: 3–4 letters then 3 digits, e.g. CSC 201")
      .refine((c) => /^[A-Z]{3,4} [1-6]/.test(c), "The first digit must be the level (1–6), e.g. CSC 201 for 200 level"),
  );

export const courseTitleSchema = z
  .string({ required_error: "Course title is required" })
  .transform(normalizeCourseTitle)
  .superRefine((v, ctx) => {
    if (/^[A-Z]{3,4}\s?\d{3}$/i.test(v)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter the course name, not its code" });
      return;
    }
    checkText(v, ctx, { label: "Course title", min: 4, max: 100, minLetters: 4, chars: /^[\p{L}\p{N} ,.:'’()&\-/]+$/u });
  });

export const courseSchema = z
  .object({
    courseCode: courseCodeSchema,
    title: courseTitleSchema,
    level: z.enum(COURSE_LEVELS, { errorMap: () => ({ message: "Pick the course level" }) }),
    semester: z.enum(COURSE_SEMESTERS, { errorMap: () => ({ message: "Pick a semester" }) }),
    unitLoad: z.coerce
      .number({ invalid_type_error: "Units must be a number" })
      .int("Units must be a whole number")
      .min(1, "Units must be between 1 and 6")
      .max(6, "Units must be between 1 and 6"),
    departmentId: z.string().uuid("Invalid department"),
  })
  .superRefine((c, ctx) => {
    const implied = levelFromCode(c.courseCode);
    if (implied && implied !== c.level) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["level"],
        message: `${c.courseCode} is a ${implied}-level code. Pick ${implied} level or fix the code.`,
      });
    }
  });

export type CourseInput = z.input<typeof courseSchema>;
export type CourseField = keyof CourseInput;

/** First error message per field, for inline display. */
export function fieldErrors<T extends string>(error: z.ZodError): Partial<Record<T, string>> {
  const out: Partial<Record<T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as T | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
