import { bookCourses, bookPages, options, questions } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";

// Helper: fetch with retry on 429
async function fetchWithRetry(url: string, options: any, retries = 5) {
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

  // Batch pages: adjust batch size as needed
  const batchSize = 5;
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const textBatch = batch.map((p) => p.textChunk).join("\n\n");

    const prompt = `
You are an exam question generator for a textbook. Your task is to create 2–3 multiple-choice questions (MCQs) from the following text.

Instructions:
1. Avoid using content from appendix or table of contents.
2. Each question must be self-contained, questions based on the book content.
3. Format output as strict JSON:
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

    const res = await fetchWithRetry(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "moonshotai/kimi-k2:free",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const data = await res.json();

    if (!data.choices || data.choices.length === 0) {
      console.warn("No AI response for this batch");
      continue;
    }

    let generated;
    try {
      generated = JSON.parse(data.choices[0].message.content || "[]");
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      continue;
    }

    // Insert questions & options
    for (const q of generated) {
      const [savedQ] = await db
        .insert(questions)
        .values({
          courseId: bookCourse.courseId,
          questionText: q.questionText,
          type: q.type || "mcq",
        })
        .returning({ id: questions.id });

      await db.insert(options).values(
        q.options.map((opt: any) => ({
          questionId: savedQ.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        }))
      );
    }

    console.log(`Processed batch ${i}–${i + batch.length}`);
  }
}
