// app/api/ask/route.ts
//
// Scalability fixes applied:
//   1. STREAMING — chunks are streamed to the client as they arrive so the
//      server doesn't hold a long-lived synchronous connection per user.
//   2. BATCHED VECTOR SEARCH — a single SQL query covers all targetBookIds
//      (using an `IN` clause) instead of one query per book.
//   3. BACKGROUND USAGE TRACKING — the `userBooks` upsert runs after the
//      stream is closed so it never delays the response.
//
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/database/drizzle";
import { userBooks, bookPages, bookCourses, courses, books } from "@/database/schema";
import { sql, eq, inArray } from "drizzle-orm";
import { getEmbedding } from "@/lib/embeddings";

// ── OpenRouter streaming helper ──────────────────────────────────────────────

async function streamFromOpenRouter(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not defined.");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_BASE_URL || "http://localhost:3000",
      "X-Title": "RCF",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          onChunk(delta);
          fullText += delta;
        }
      } catch {
        // Ignore malformed SSE lines.
      }
    }
  }

  return fullText;
}

// ── Gemini streaming fallback (non-streaming SDK, but kept async) ─────────────

async function streamFromGemini(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
): Promise<string> {
  const { generateWithGemini } = await import("@/lib/gemini");
  const geminiMessages = messages.map(m => ({
    role: m.role === "assistant" ? "model" as const : m.role as "user" | "model" | "system",
    content: m.content,
  }));
  const result = await generateWithGemini(geminiMessages);
  const text = result ?? "";
  if (text) onChunk(text);
  return text;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, bookId, courseId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages array or too many messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sanitizedMessages = messages.map((m: any) => ({
      ...m,
      content: typeof m.content === "string" ? m.content.substring(0, 5000) : m.content,
    }));

    const lastUserMessage = sanitizedMessages.filter((m: any) => m.role === "user").pop()?.content;

    // ── 1. Resolve book IDs + course context ─────────────────────────────────
    let targetBookIds: string[] = [];
    let courseContext: { courseCode: string; title: string; level: string } | null = null;
    let workspaceBookTitles: string[] = [];

    if (courseId) {
      try {
        const [courseRow] = await db
          .select({ courseCode: courses.courseCode, title: courses.title, level: courses.level })
          .from(courses)
          .where(eq(courses.id, courseId))
          .limit(1);
        if (courseRow) courseContext = courseRow;

        const linkedBookRows = await db
          .select({ bookId: bookCourses.bookId, title: books.title })
          .from(bookCourses)
          .innerJoin(books, eq(bookCourses.bookId, books.id))
          .where(eq(bookCourses.courseId, courseId));

        targetBookIds      = linkedBookRows.map(r => r.bookId);
        workspaceBookTitles = linkedBookRows.map(r => r.title);
      } catch (err) {
        console.warn("Failed resolving course workspace books:", err);
      }
    } else if (bookId) {
      targetBookIds = [bookId];
    }

    // ── 2. BATCHED vector search — single query across ALL books ─────────────
    let contextChunks: string[] = [];
    if (targetBookIds.length > 0 && lastUserMessage) {
      try {
        const queryEmbedding = await getEmbedding(lastUserMessage);
        if (queryEmbedding.length > 0) {
          const queryEmbeddingStr = JSON.stringify(queryEmbedding);
          const limitTotal        = courseId ? targetBookIds.length * 3 : 5;

          // Single SQL trip instead of N trips in a loop.
          const retrievedPages = await db
            .select({ textChunk: bookPages.textChunk })
            .from(bookPages)
            .where(inArray(bookPages.bookId, targetBookIds))
            .orderBy(sql`${bookPages.embedding} <=> ${queryEmbeddingStr}::vector`)
            .limit(limitTotal);

          contextChunks = retrievedPages
            .map(p => p.textChunk)
            .filter(Boolean)
            .slice(0, 12) as string[];
        }
      } catch (err) {
        console.warn("Failed retrieving RAG context:", err);
      }
    }

    // ── 3. Build system prompt ────────────────────────────────────────────────
    let systemPromptContent: string;
    if (courseContext) {
      const bookList = workspaceBookTitles.length > 0
        ? `\n\nMaterials in this workspace:\n${workspaceBookTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
        : "";
      systemPromptContent = contextChunks.length > 0
        ? `You are an expert academic study assistant for the course **${courseContext.courseCode} - ${courseContext.title}** (${courseContext.level} Level).\n\nYou have access to ALL study materials in this course workspace. Use the retrieved context below to give precise, exam-focused answers. If the answer is not in the provided context, clearly state that and offer general knowledge as supplement.${bookList}\n\nRetrieved Context:\n${contextChunks.join("\n\n---\n\n")}`
        : `You are an expert academic study assistant for the course **${courseContext.courseCode} - ${courseContext.title}** (${courseContext.level} Level). Answer questions comprehensively. Help the student understand concepts, solve problems, and prepare for exams.${bookList}`;
    } else if (contextChunks.length > 0) {
      systemPromptContent = `You are a helpful study assistant. Answer the user's question using ONLY the context provided below. If you cannot find the answer in the context, say you don't know based on the provided material.\n\nContext:\n${contextChunks.join("\n\n---\n\n")}`;
    } else {
      systemPromptContent = "You are a helpful study assistant. Help the student understand academic concepts, solve problems, and prepare for exams.";
    }

    const fullMessages = [
      { role: "system", content: systemPromptContent },
      ...sanitizedMessages,
    ];

    // ── 4. Stream response to client ─────────────────────────────────────────
    const encoder = new TextEncoder();
    let fullResponseText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (text: string) => {
          // Send each chunk as a Server-Sent Event so existing clients
          // that read `response` as JSON will still work if they consume
          // the full stream — but streaming-aware clients get instant chunks.
          controller.enqueue(encoder.encode(text));
        };

        try {
          fullResponseText = await streamFromOpenRouter(fullMessages, enqueue, req.signal);
        } catch {
          try {
            fullResponseText = await streamFromGemini(fullMessages, enqueue);
          } catch (fallbackErr) {
            console.error("All AI streams failed:", fallbackErr);
            enqueue("The AI assistant is currently unavailable. Please try again later.");
          }
        }

        // Strip <think> tags from the accumulated full text (for clients
        // that also consume the raw stream).
        fullResponseText = fullResponseText.replace(/<think>[\s\S]*?<\/think>/, "").trim();

        controller.close();

        // ── 5. Background usage tracking (after stream closes) ───────────────
        const booksToTrack = bookId ? [bookId] : targetBookIds;
        if (booksToTrack.length > 0) {
          Promise.allSettled(
            booksToTrack.map(bid =>
              db
                .insert(userBooks)
                .values({
                  userId:              user.id,
                  bookId:              bid,
                  aiRequests:          1,
                  lastAIInteractionAt: new Date(),
                })
                .onConflictDoUpdate({
                  target: [userBooks.userId, userBooks.bookId],
                  set: {
                    aiRequests:          sql`${userBooks.aiRequests} + 1`,
                    lastAIInteractionAt: new Date(),
                    updatedAt:           new Date(),
                  },
                })
            )
          ).catch(err => console.error("Background AI tracking failed:", err));
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":  "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        // Allow older non-streaming consumers to detect stream end.
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    console.error("[POST /api/ask]", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to process AI request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
