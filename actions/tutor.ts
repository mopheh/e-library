"use server";

import { db } from "@/database/drizzle";
import { bookPages, bookCourses, books, courses } from "@/database/schema";
import { eq, and, inArray, sql, desc, gt, cosineDistance } from "drizzle-orm";
import { getEmbedding } from "@/lib/embeddings";
import { generateWithGemini, GeminiMessage } from "@/lib/gemini";
import { auth } from "@clerk/nextjs/server";

export async function askAiTutor(courseId: string, messages: GeminiMessage[]) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const lastMessage = messages[messages.length - 1].content;

        // 1. Get relevant chunks
        const chunks = await getRelevantChunks(courseId, lastMessage);

        // 2. Build Context String
        const context = chunks.length > 0
            ? chunks.map(c => `[Source: ${c.bookTitle}, Page: ${c.pageNumber}]\n${c.text}`).join("\n\n---\n\n")
            : "No specific course materials found for this query.";

        // 3. Prepare System Instructions
        const course = await db.query.courses.findFirst({
            where: eq(courses.id, courseId)
        });

        const systemInstruction = `
You are the UniVault AI Tutor for the course: ${course?.courseCode} - ${course?.title}.
Your goal is to provide accurate, academic, and encouraging assistance to students.

CRITICAL INSTRUCTIONS:
1. Use the provided "COURSE CONTEXT" below to answer the user's question.
2. If the context contains the answer, cite the source title and page number.
3. If the context does NOT contain enough information, use your general knowledge but mention that this isn't explicitly in the course materials.
4. Keep explanations clear and structured. Use LaTeX for mathematical formulas if needed.
5. Be encouraging like a senior mentor.

COURSE CONTEXT:
${context}
        `.trim();

        // 4. Generate Response
        // We prepend the system instruction as the first message if it's a new chat, 
        // or just pass it to our utility which handles it.
        const responseText = await generateWithGemini([
            { role: "system", content: systemInstruction },
            ...messages
        ]);

        return { 
            success: true, 
            data: responseText,
            sources: chunks.map(c => ({ title: c.bookTitle, page: c.pageNumber }))
        };

    } catch (error) {
        console.error("AI Tutor Error:", error);
        return { success: false, error: "I'm having trouble connecting to my knowledge base right now." };
    }
}

async function getRelevantChunks(courseId: string, query: string) {
    // 1. Get Course Books
    const courseBooks = await db
        .select({ bookId: bookCourses.bookId })
        .from(bookCourses)
        .where(eq(bookCourses.courseId, courseId));

    const bookIds = courseBooks.map(cb => cb.bookId);
    if (bookIds.length === 0) return [];

    // 2. Embed Query
    const queryEmbedding = await getEmbedding(query);
    if (queryEmbedding.length === 0) return [];

    // 3. Vector Search
    // We use 1 - cosine_distance to get similarity (closer to 1 is better)
    const similarity = sql<number>`1 - (${cosineDistance(bookPages.embedding, queryEmbedding)})`;

    const results = await db
        .select({
            text: bookPages.textChunk,
            pageNumber: bookPages.pageNumber,
            bookTitle: books.title,
            similarity: similarity
        })
        .from(bookPages)
        .innerJoin(books, eq(bookPages.bookId, books.id))
        .where(
            and(
                inArray(bookPages.bookId, bookIds),
                gt(similarity, 0.4) // Threshold for relevance
            )
        )
        .orderBy(desc(similarity))
        .limit(5);

    return results.map(r => ({
        text: r.text || "",
        pageNumber: r.pageNumber,
        bookTitle: r.bookTitle
    }));
}
