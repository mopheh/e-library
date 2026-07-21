import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.worker" });

import { bookCourses, bookPages, options, questions } from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq } from "drizzle-orm";

/** Non-retryable OpenRouter error codes (billing / auth). */
const OR_FATAL_CODES = [401, 402, 403];
const isOpenRouterBillingError = (msg: string) =>
  OR_FATAL_CODES.some((c) => msg.includes(String(c))) ||
  msg.toLowerCase().includes("insufficient credits") ||
  msg.toLowerCase().includes("unauthorized");

// Transient/service-side - retrying (possibly on a different key) can help.
const isRetryableError = (msg: string) => {
  const m = msg.toLowerCase();
  return (
    msg.includes("429") || msg.includes("503") ||
    m.includes("rate limit") || m.includes("quota") ||
    m.includes("unavailable") || m.includes("overloaded") || m.includes("high demand")
  );
};
// Key/project-specific - useless to retry on the SAME key, but a different
// key in the rotation may well be fine (observed in practice: one key 403'd
// with "project has been denied access" while its siblings worked).
const isAuthError = (msg: string) => {
  const m = msg.toLowerCase();
  return msg.includes("401") || msg.includes("403") || m.includes("permission") || m.includes("denied") || m.includes("unauthorized");
};

// Support GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, ... so
// throughput on the free tier can be multiplied by round-robining across
// several free API keys/projects instead of paying per-token via OpenRouter.
const GEMINI_KEYS = Object.keys(process.env)
  .filter((k) => /^GEMINI_API_KEY(_\d+)?$/.test(k))
  .sort()
  .map((k) => process.env[k])
  .filter((v): v is string => !!v && v.trim().length > 0);

let geminiKeyCursor = 0;
function nextGeminiKey(): string {
  const key = GEMINI_KEYS[geminiKeyCursor % GEMINI_KEYS.length];
  geminiKeyCursor++;
  return key;
}

/**
 * Primary generation path: direct Gemini calls, round-robining across all
 * configured free-tier keys. On a rate-limit error we move straight to the
 * next key (its quota is independent) rather than sleeping on the same one;
 * a single-key setup still backs off and retries. Non-rate-limit errors fail
 * fast instead of burning through every key on a doomed prompt.
 */
async function generateWithGeminiRoundRobin(prompt: string): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("No GEMINI_API_KEY configured");
  }

  const maxAttempts = GEMINI_KEYS.length * 2;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = nextGeminiKey();
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const result = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ parts: [{ text: prompt }] }],
      });
      return result.text || "";
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);

      if (isAuthError(msg)) {
        console.warn(`Gemini key ending ...${key.slice(-4)} looks invalid/denied, rotating to next key. (${msg.slice(0, 150)})`);
        continue; // this key is broken, not the request - try another
      }
      if (isRetryableError(msg) && GEMINI_KEYS.length === 1) {
        console.warn("Gemini rate-limited/overloaded (single key configured), backing off 15s...");
        await new Promise((r) => setTimeout(r, 15000));
        continue;
      }
      // Multi-key rate-limit/overload, or an unrecognized error shape: still
      // rotate rather than aborting outright - bounded by maxAttempts above,
      // so a genuinely bad prompt still gives up promptly either way.
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Gemini round-robin exhausted attempts");
}

// The prompt tells the model to ignore front matter/exam-logistics text, but
// it still sometimes turns a cover page or instructions block into a
// plausible-looking MCQ (e.g. "Who is the author of this book?", "What is
// the exam venue?"). Those pass JSON validation fine, so they need a
// dedicated filter, applied to the question text right before insertion.
const META_QUESTION_PATTERNS: RegExp[] = [
  /\b(author|publisher|editor)s?\b.*\b(book|text|document|material|passage|article|chapter|module)\b/i,
  /\bwho\s+(is|was|wrote|authored|edited|published)\b/i,
  /\bisbn\b|\bissn\b/i,
  /\bcopyright\b/i,
  /\b(publication|published)\s+(year|date)\b/i,
  /\bwhich\s+edition\b/i,
  /\bexam(ination)?\s+(venue|hall|centre|center|duration|time\s+allowed)\b/i,
  /\binvigilat\w*/i,
  /\bmatric(ulation)?\s+number\b/i,
  /\binstructions?\s+(to|for)\s+candidates?\b/i,
  /\bhow many\s+(marks|questions)\s+(are|is|were)\b/i,
  /\btable of contents\b/i,
  /\bpage\s+numbers?\b/i,
  /\bfont\s+(size|type|style|family)\b/i,
  /\b(bold|italic|underlined?)\s+text\b/i,
  /\bwatermark\b/i,
  /\bcover\s+page\b/i,
  /\btitle\s+of\s+(this|the)\s+(book|document|material|text|module)\b/i,
  /\bhow many pages\b/i,
];

function isMetaQuestion(text: string): boolean {
  return META_QUESTION_PATTERNS.some((re) => re.test(text));
}

export async function generateQuestionsFromBook(bookId: string) {
  // Get course for the book
  const [bookCourse] = await db
    .select()
    .from(bookCourses)
    .where(eq(bookCourses.bookId, bookId));

  // Get pages, ordered - batches below assume page-adjacency, and the cap
  // below assumes "first N pages" means by page number, not insertion order.
  // needsReview pages (low-confidence OCR - handwritten/unreadable scans,
  // or a garbled pre-existing text layer, per parsePdfPages) are excluded
  // the same way they're excluded from RAG: their text isn't trustworthy
  // enough to turn into questions, so including them just produces
  // confidently-wrong or nonsensical MCQs.
  const allPages = await db
    .select()
    .from(bookPages)
    .where(and(eq(bookPages.bookId, bookId), eq(bookPages.needsReview, false)))
    .orderBy(bookPages.pageNumber);

  // Most books don't need MCQs generated from literally every page - this is
  // the single biggest lever on total call volume for the 1000+ page
  // textbooks that dominate cost. Practice questions drawn from the first
  // couple hundred pages still cover the large majority of a course's core
  // concepts for far less spend.
  const PAGE_CAP = 175;
  const pages = allPages.slice(0, PAGE_CAP);
  if (allPages.length > PAGE_CAP) {
    console.log(`📉 Capping question generation at ${PAGE_CAP}/${allPages.length} pages for book ${bookId}`);
  }

  const batchSize = 5;
  // Track whether OpenRouter has failed permanently so we skip it for remaining batches
  let openRouterDisabled = !process.env.OPENROUTER_API_KEY;

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const textBatch = batch.map((p) => p.textChunk).join("\n\n");

    const prompt = `
You are an expert academic question generator. Your task is to extract 3–5 multiple-choice questions (MCQs) from the provided text.

CRITICAL RULES:
1. ONLY generate questions that test understanding of the course's actual subject matter - concepts, facts, theories, processes, definitions.
2. NEVER generate a question about the source material itself: its author, publisher, editor, ISBN, edition, publication date/year, copyright, title, table of contents, page count/numbers, fonts, or formatting/markup.
3. NEVER generate a question about exam/assessment logistics mentioned in the text: venue, date, duration, marks allocation, invigilators, matriculation numbers, or instructions to candidates.
4. COMPLETELY IGNORE cover pages, copyright notices, tables of contents, formatting notes, and exam instructions as source material - do not turn them into questions.
5. If the provided text contains NO actual educational subject matter (e.g. it is entirely front matter/boilerplate), return an empty JSON array: []
6. Each question must be self-contained and accurate based strictly on the text.
7. Format output as strict JSON:
[
  {
    "questionText": "...",
    "type": "mcq",
    "options": [
      { "optionText": "...", "isCorrect": false },
      { "optionText": "...", "isCorrect": true },
      { "optionText": "...", "isCorrect": false },
      { "optionText": "...", "isCorrect": false }
    ]
  }
]

Text: ${textBatch}
`;

    let responseText = "";

    // ── Primary: Gemini (free tier, round-robin across configured keys) ────
    if (GEMINI_KEYS.length > 0) {
      try {
        responseText = await generateWithGeminiRoundRobin(prompt);
        if (responseText) {
          console.log(`✅ Gemini: questions generated for batch ${i}`);
        } else {
          console.warn(`⚠️ Gemini returned empty content for batch ${i}`);
        }
      } catch (geminiErr: any) {
        console.error(`❌ Gemini round-robin failed for batch ${i}:`, geminiErr.message);
      }
    }

    // ── Fallback: OpenRouter (paid) ─────────────────────────────────────────
    if (!responseText && !openRouterDisabled) {
      try {
        const fetchReq = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });

        if (fetchReq.status === 429) {
          console.warn("Rate limit hit on OpenRouter. Sleeping 10 s before retrying batch...");
          await new Promise((r) => setTimeout(r, 10000));
          i -= batchSize; // retry this batch
          continue;
        }

        const json = await fetchReq.json();

        if (!fetchReq.ok) {
          throw new Error(json.error?.message || `HTTP ${fetchReq.status}`);
        }

        responseText = json.choices?.[0]?.message?.content || "";
        if (responseText) {
          console.log(`✅ OpenRouter (fallback): questions generated for batch ${i}`);
        } else {
          console.warn(`⚠️ OpenRouter returned empty content for batch ${i}`);
        }
      } catch (orErr: any) {
        const errMsg: string = orErr.message || String(orErr);

        if (isOpenRouterBillingError(errMsg)) {
          console.warn(
            `⚠️ OpenRouter billing/auth error detected. Disabling OpenRouter for this job. (${errMsg})`
          );
          openRouterDisabled = true;
        } else {
          console.error(`❌ OpenRouter fallback error on batch ${i}:`, errMsg);
        }
      }
    }

    // Add a mandatory sleep to gracefully respect API token limits across loops
    await new Promise(r => setTimeout(r, 2000));

    if (!responseText) {
      console.warn("No AI response for this batch");
      continue;
    }

    interface AIQuestion {
      questionText: string;
      type: "mcq" | "short_answer";
      options: {
        optionText: string;
        isCorrect: boolean;
      }[];
    }

    let generated: AIQuestion[];
    try {
      // Clean up markdown code blocks if present
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      let parsed = JSON.parse(cleaned || "[]");

      // Sometimes smaller models return a single object instead of an array
      if (!Array.isArray(parsed)) {
        parsed = typeof parsed === "object" && parsed !== null ? [parsed] : [];
      }

      generated = parsed as AIQuestion[];
    } catch (err) {
      console.error("Failed to parse AI response:", responseText, err);
      continue;
    }

    // Insert questions & options
    for (const q of generated) {
      // Small models sometimes use different keys, let's catch the common ones
      const qText = q.questionText || (q as any).question || (q as any).text;
      const qOptions = q.options || (q as any).choices;

      // Validate that we actually have a question and options before hitting the database
      if (!qText || !Array.isArray(qOptions) || qOptions.length === 0) {
        console.warn("Skipping poorly formatted question from AI:", q);
        continue;
      }

      if (isMetaQuestion(String(qText))) {
        console.warn("Skipping meta/boilerplate question (about the material itself, not its subject matter):", qText);
        continue;
      }

      try {
        const [savedQ] = await db
          .insert(questions)
          .values({
            courseId: bookCourse?.courseId,
            questionText: String(qText),
            type: q.type || "mcq",
          })
          .returning({ id: questions.id });

        await db.insert(options).values(
          qOptions.map((opt: any) => ({
            questionId: savedQ.id,
            optionText: String(opt.optionText || opt.text || opt.option || opt),
            isCorrect: Boolean(opt.isCorrect || opt.correct || opt.is_correct),
          }))
        );
      } catch (insertErr) {
        console.error("Database insert failed for question:", qText, insertErr);
      }
    }

    console.log(`Processed batch ${i}–${i + batch.length}`);
  }
}
