// app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { askOpenRouter } from "@/actions/openrouter";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/database/drizzle";
import { userBooks, bookPages, bookCourses, courses, books } from "@/database/schema";
import { sql, eq } from "drizzle-orm";
import { getEmbedding } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, bookId, courseId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length > 50) {
      return NextResponse.json({ error: "Invalid messages array or too many messages" }, { status: 400 });
    }

    // Limit each message content to 5000 chars max
    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: typeof m.content === "string" ? m.content.substring(0, 5000) : m.content
    }));

    let customMessages = [...sanitizedMessages];
    const lastUserMessage = sanitizedMessages.filter(m => m.role === "user").pop()?.content;
    let contextChunks: string[] = [];

    // Resolve which book IDs to search — either a single book or all books in a course workspace
    let targetBookIds: string[] = [];
    let courseContext: { courseCode: string; title: string; level: string } | null = null;
    let workspaceBookTitles: string[] = [];

    if (courseId) {
      // Workspace-scoped RAG: pull context from ALL books linked to this course
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

        targetBookIds = linkedBookRows.map((r) => r.bookId);
        workspaceBookTitles = linkedBookRows.map((r) => r.title);
      } catch (err) {
        console.warn("Failed resolving course workspace books:", err);
      }
    } else if (bookId) {
      targetBookIds = [bookId];
    }

    if (targetBookIds.length > 0 && lastUserMessage) {
      try {
        const queryEmbedding = await getEmbedding(lastUserMessage);
        if (queryEmbedding.length > 0) {
          const queryEmbeddingStr = JSON.stringify(queryEmbedding);

          // Fetch top-N chunks across all target books, ranked by semantic similarity
          const limitPerBook = courseId ? 3 : 5; // spread context across books when in workspace mode
          const allChunks: string[] = [];

          for (const bid of targetBookIds) {
            const retrievedPages = await db
              .select({ textChunk: bookPages.textChunk })
              .from(bookPages)
              .where(eq(bookPages.bookId, bid))
              .orderBy(sql`${bookPages.embedding} <=> ${queryEmbeddingStr}::vector`)
              .limit(limitPerBook);

            const chunks = retrievedPages
              .map((p) => p.textChunk)
              .filter(Boolean) as string[];
            allChunks.push(...chunks);
          }

          contextChunks = allChunks.slice(0, 12); // cap at 12 chunks total
        }
      } catch (err) {
        console.warn("Failed retrieving RAG context:", err);
      }
    }

    // Build system prompt — richer when in course workspace mode
    let systemPromptContent: string;
    if (courseContext) {
      const bookList = workspaceBookTitles.length > 0
        ? `\n\nMaterials in this workspace:\n${workspaceBookTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
        : "";
      if (contextChunks.length > 0) {
        systemPromptContent = `You are an expert academic study assistant for the course **${courseContext.courseCode} - ${courseContext.title}** (${courseContext.level} Level).\n\nYou have access to ALL study materials in this course workspace, including textbooks, lecture notes, and past exam questions. Use the retrieved context below to give precise, exam-focused answers. If the answer is not in the provided context, clearly state that and offer general knowledge as supplement.${bookList}\n\nRetrieved Context:\n${contextChunks.join("\n\n---\n\n")}`;
      } else {
        systemPromptContent = `You are an expert academic study assistant for the course **${courseContext.courseCode} - ${courseContext.title}** (${courseContext.level} Level). Answer questions comprehensively using your knowledge of this subject area. Help the student understand concepts, solve problems, and prepare for exams.${bookList}`;
      }
    } else if (contextChunks.length > 0) {
      systemPromptContent = `You are a helpful study assistant. Answer the user's question using ONLY the context provided below. If you cannot find the answer in the context, say you don't know based on the provided material.\n\nContext:\n${contextChunks.join("\n\n---\n\n")}`;
    } else {
      systemPromptContent = "You are a helpful study assistant. Help the student understand academic concepts, solve problems, and prepare for exams.";
    }

    customMessages = [
      { role: "system", content: systemPromptContent },
      ...messages
    ];

    const response = await askOpenRouter(customMessages);
    const cleaned = response.replace(/<think>[\s\S]*?<\/think>/, "").trim();

    // Usage Tracking — track per-book AI usage for all books in context
    const booksToTrack = bookId ? [bookId] : targetBookIds;
    if (booksToTrack.length > 0 && user) {
      await Promise.allSettled(
        booksToTrack.map((bid) =>
          db
            .insert(userBooks)
            .values({
              userId: user.id,
              bookId: bid,
              aiRequests: 1,
              lastAIInteractionAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [userBooks.userId, userBooks.bookId],
              set: {
                aiRequests: sql`${userBooks.aiRequests} + 1`,
                lastAIInteractionAt: new Date(),
                updatedAt: new Date(),
              },
            })
        )
      );
    }

    return NextResponse.json({ response: cleaned });
  } catch (error: any) {
    console.error("[POST /api/ask]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process AI request" },
      { status: 500 }
    );
  }
}
