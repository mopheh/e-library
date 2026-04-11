// app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import { askDeepSeek } from "@/actions/deepseek";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/database/drizzle";
import { userBooks, bookPages } from "@/database/schema";
import { sql, eq } from "drizzle-orm";
import { getEmbedding } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, bookId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    let customMessages = [...messages];
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content;
    let contextChunks: string[] = [];

    if (bookId && lastUserMessage) {
      try {
        const queryEmbedding = await getEmbedding(lastUserMessage);
        if (queryEmbedding.length > 0) {
          const queryEmbeddingStr = JSON.stringify(queryEmbedding);
          const retrievedPages = await db
            .select({ textChunk: bookPages.textChunk })
            .from(bookPages)
            .where(eq(bookPages.bookId, bookId))
            .orderBy(sql`${bookPages.embedding} <=> ${queryEmbeddingStr}::vector`)
            .limit(5);

          contextChunks = retrievedPages
             .map((p) => p.textChunk)
             .filter(Boolean) as string[];
        }
      } catch (err) {
        console.warn("Failed retrieving RAG context:", err);
      }
    }

    if (contextChunks.length > 0) {
      const systemContext = `You are a helpful study assistant. Answer the user's question using ONLY the context provided below. If you cannot find the answer in the context, say you don't know based on the provided material.\n\nContext:\n${contextChunks.join("\n\n---\n\n")}`;
      customMessages = [
        { role: "system", content: systemContext },
        ...messages
      ];
    } else {
      customMessages = [
        { role: "system", content: "You are a helpful study assistant." },
        ...messages
      ];
    }

    const response = await askDeepSeek(customMessages);
    const cleaned = response.replace(/<think>[\s\S]*?<\/think>/, "").trim();

    // Usage Tracking
    if (bookId) {

      if (user) {
        await db
          .insert(userBooks)
          .values({
            userId: user.id,
            bookId: bookId,
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
          });
      }
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
