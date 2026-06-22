import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.worker" });

import { bookCourses, bookPages, options, questions } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";

/** Non-retryable OpenRouter error codes (billing / auth). */
const OR_FATAL_CODES = [401, 402, 403];
const isOpenRouterBillingError = (msg: string) =>
  OR_FATAL_CODES.some((c) => msg.includes(String(c))) ||
  msg.toLowerCase().includes("insufficient credits") ||
  msg.toLowerCase().includes("unauthorized");

/** Fall back to Gemini directly for question generation. */
async function generateWithGeminiFallback(
  prompt: string,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
  });
  return result.text || "";
}


// Helper: fetch with retry on 429
async function fetchWithRetry(url: string, options: RequestInit, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;

    const retryAfter = parseInt(res.headers.get("Retry-After") || "5");
    console.warn(`Rate limit hit, retrying in ${retryAfter}s...`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
  }
  throw new Error("Max retries exceeded due to rate limiting.");
}

export async function generateQuestionsFromBook(bookId: string) {
  // Get course for the book
  const [bookCourse] = await db
    .select()
    .from(bookCourses)
    .where(eq(bookCourses.bookId, bookId));

  // Get pages
  const pages = await db
    .select()
    .from(bookPages)
    .where(eq(bookPages.bookId, bookId));

  const batchSize = 5;
  // Track whether OpenRouter has failed permanently so we skip it for remaining batches
  let openRouterDisabled = !process.env.OPENROUTER_API_KEY;

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const textBatch = batch.map((p) => p.textChunk).join("\n\n");

    const prompt = `
You are an expert academic question generator. Your task is to extract 3–5 multiple-choice questions (MCQs) from the provided text.

CRITICAL RULES:
1. ONLY generate questions from actual academic subject matter, core concepts, or educational content.
2. COMPLETELY IGNORE exam instructions, cover pages, copyright notices, table of contents, formatting notes, and boilerplate text.
3. If the provided text contains NO actual educational subject matter, return an empty JSON array: []
4. Each question must be self-contained and accurate based strictly on the text.
5. Format output as strict JSON:
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

    // ── Primary: OpenRouter ────────────────────────────────────────────────
    if (!openRouterDisabled) {
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
          console.log(`✅ OpenRouter: questions generated for batch ${i}`);
        } else {
          console.warn(`⚠️ OpenRouter returned empty content for batch ${i}`);
        }
      } catch (orErr: any) {
        const errMsg: string = orErr.message || String(orErr);

        if (isOpenRouterBillingError(errMsg)) {
          // Permanent billing/auth failure — disable for all remaining batches
          console.warn(
            `⚠️ OpenRouter billing/auth error detected. Disabling OpenRouter for this job and falling back to Gemini. (${errMsg})`
          );
          openRouterDisabled = true;
        } else {
          // Transient error — skip this batch and keep trying with OpenRouter
          console.error(`❌ OpenRouter transient error on batch ${i}:`, errMsg);
          continue;
        }
      }
    }

    // ── Fallback: Gemini direct ────────────────────────────────────────────
    if (!responseText) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        console.error("No GEMINI_API_KEY available — cannot generate questions for this batch.");
        continue;
      }
      try {
        console.log(`🤖 Gemini fallback: generating questions for batch ${i}...`);
        responseText = await generateWithGeminiFallback(prompt, geminiKey);
        if (responseText) {
          console.log(`✅ Gemini: questions generated for batch ${i}`);
        }
      } catch (geminiErr: any) {
        console.error(`❌ Gemini fallback also failed for batch ${i}:`, geminiErr.message);
        continue;
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
