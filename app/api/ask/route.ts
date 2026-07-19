import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/database/drizzle";
import { userBooks, bookPages, bookCourses, courses, books, systemSettings } from "@/database/schema";
import { sql, eq, inArray, and, isNotNull, gte, sum } from "drizzle-orm";
import { getEmbedding } from "@/lib/embeddings";
import { streamText, convertToModelMessages, ModelMessage, UIMessage, LanguageModel } from "ai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { withCache } from "@/lib/redis";

// OpenRouter fallback provider
const openRouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// `ai` v7 dropped the old `fallback()` model helper. This reimplements the
// same intent: try the primary model, and if constructing/starting the
// stream throws (bad/missing API key, model unavailable, provider outage
// surfaced synchronously) retry with the next model in the list. It can't
// recover from a failure that happens mid-stream after tokens have already
// been sent to the client — only from failures at stream start.
function streamTextWithFallback(
  models: LanguageModel[],
  options: { messages: ModelMessage[]; onFinish?: Parameters<typeof streamText>[0]["onFinish"] }
) {
  let lastError: unknown;
  for (const model of models) {
    try {
      return streamText({ model, ...options });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    // Fetch user + system settings in parallel to cut cold-path latency
    const [user, settings] = await Promise.all([
      getCurrentUser(),
      withCache("system:settings", 60, () =>
        db.select().from(systemSettings).limit(1).then((r) => r[0] ?? null)
      ),
    ]);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!user.aiEnabled) {
      return new Response(JSON.stringify({ error: "AI access has been disabled for your account." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (settings && !settings.aiEnabled) {
      return new Response(JSON.stringify({ error: "AI features are currently disabled." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Per-user daily request cap ──────────────────────────────────────────
    const limitEnabled = settings?.aiRequestLimitEnabled ?? true;
    const requestLimit = settings?.aiRequestLimit ?? 10;
    if (limitEnabled) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [countRow] = await db
        .select({ total: sum(userBooks.aiRequests) })
        .from(userBooks)
        .where(and(eq(userBooks.userId, user.id), gte(userBooks.lastAIInteractionAt, todayStart)));

      const usedToday = Number(countRow?.total ?? 0);
      if (usedToday >= requestLimit) {
        return new Response(
          JSON.stringify({
            error: `You've reached your daily limit of ${requestLimit} AI request${requestLimit === 1 ? "" : "s"}. Please try again tomorrow.`,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const { messages, bookId, courseId, pageImage }: {
      messages: UIMessage[];
      bookId?: string;
      courseId?: string;
      pageImage?: string;
    } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages array or too many messages" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Truncate each text part rather than the old flat `content` string —
    // UIMessages carry their text (and any other parts) inside `parts`.
    const sanitizedMessages: UIMessage[] = messages.map((m) => ({
      ...m,
      parts: m.parts.map((p) =>
        p.type === "text" ? { ...p, text: p.text.slice(0, 5000) } : p
      ),
    }));

    const lastUserMsgIndex = sanitizedMessages.findLastIndex(m => m.role === "user");
    const lastUserMessage = lastUserMsgIndex !== -1
      ? sanitizedMessages[lastUserMsgIndex].parts
          .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
          .map(p => p.text)
          .join("")
      : "";

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
          .where(and(eq(bookCourses.courseId, courseId), eq(books.reviewStatus, "APPROVED")));

        targetBookIds      = linkedBookRows.map(r => r.bookId);
        workspaceBookTitles = linkedBookRows.map(r => r.title);
      } catch (err) {
        console.warn("Failed resolving course workspace books:", err);
      }
    } else if (bookId) {
      const [targetBook] = await db
        .select({ reviewStatus: books.reviewStatus, postedBy: books.postedBy })
        .from(books)
        .where(eq(books.id, bookId))
        .limit(1);
      const canUseBook =
        targetBook &&
        (targetBook.reviewStatus === "APPROVED" ||
          user.id === targetBook.postedBy ||
          user.role === "ADMIN" ||
          user.role === "FACULTY REP");
      if (canUseBook) targetBookIds = [bookId];
    }

    // ── 2. BATCHED vector search — single query across ALL books ─────────────
    let contextChunks: string[] = [];
    if (targetBookIds.length > 0 && lastUserMessage) {
      try {
        const queryEmbedding = await getEmbedding(lastUserMessage);
        if (queryEmbedding.length > 0) {
          const queryEmbeddingStr = JSON.stringify(queryEmbedding);
          const limitTotal        = courseId ? targetBookIds.length * 3 : 5;

          const retrievedPages = await db
            .select({ textChunk: bookPages.textChunk })
            .from(bookPages)
            .where(and(inArray(bookPages.bookId, targetBookIds), isNotNull(bookPages.embedding)))
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

    // Attach the captured page screenshot to the last user message as a
    // `file` part — convertToModelMessages() turns this into proper image
    // content for the model, same as a user-attached image would be.
    if (pageImage && typeof pageImage === "string" && lastUserMsgIndex !== -1) {
      const match = pageImage.match(/^data:(image\/[a-zA-Z]+);base64,/);
      if (match) {
        const mimeType = match[1];
        sanitizedMessages[lastUserMsgIndex] = {
          ...sanitizedMessages[lastUserMsgIndex],
          parts: [
            ...sanitizedMessages[lastUserMsgIndex].parts,
            { type: "file", mediaType: mimeType, url: pageImage },
          ],
        };
      }
    }

    const coreMessages: ModelMessage[] = [
      { role: "system", content: systemPromptContent },
      ...(await convertToModelMessages(sanitizedMessages)),
    ];

    // ── 4. Stream response to client using Vercel AI SDK ─────────────────────
    const result = streamTextWithFallback(
      [google("gemini-2.5-flash"), openRouter("openrouter/free")],
      {
        messages: coreMessages,
        onFinish: async () => {
        // ── 5. Background usage tracking (after stream finishes) ───────────────
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
      }
    });

    return result.toUIMessageStreamResponse();

  } catch (error: any) {
    console.error("[POST /api/ask]", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to process AI request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
