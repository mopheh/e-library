import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { questions, questionTopics, examInsights } from "@/database/schema";
import { eq, inArray } from "drizzle-orm";
import { generateContent } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;

    // 1. Fetch all questions for this course
    const courseQuestions = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
      })
      .from(questions)
      .where(eq(questions.courseId, courseId));

    if (courseQuestions.length === 0) {
      return NextResponse.json({ message: "No questions to analyze", insights: [] });
    }

    // 2. See which of THIS course's questions already have topics
    const courseQuestionIds = courseQuestions.map(q => q.id);
    const existingTopics = await db
      .select({ questionId: questionTopics.questionId })
      .from(questionTopics)
      .where(inArray(questionTopics.questionId, courseQuestionIds));

    const existingTopicIds = new Set(existingTopics.map(t => t.questionId));
    const questionsToAnalyze = courseQuestions.filter(q => !existingTopicIds.has(q.id));

    // 3. Batch processing with AI for unanalyzed questions (in chunks of 10 to avoid token limits)
    if (questionsToAnalyze.length > 0) {
      const chunks = [];
      for (let i = 0; i < questionsToAnalyze.length; i += 10) {
        chunks.push(questionsToAnalyze.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const prompt = `Analyze the following exam questions and assign exactly ONE core academic topic to each question (e.g., "Thevenin's Theorem", "Calculus", "Thermodynamics"). Return only a valid JSON array of objects, where each object has "id" and "topic" fields. Do not include markdown formatting.\n\nQuestions:\n${JSON.stringify(chunk.map(q => ({ id: q.id, text: q.questionText })))}`

        try {
          const rawText = await generateContent(prompt, "gemini-3-flash-preview");
          const _jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(_jsonString);

          const validItems = (Array.isArray(parsed) ? parsed : [])
            .filter((item: any) => item.id && item.topic)
            .map((item: any) => ({ questionId: item.id, topicName: String(item.topic).trim() }));

          if (validItems.length > 0) {
            await db.insert(questionTopics).values(validItems);
          }
        } catch (e) {
          console.error("AI Topic parsing failed for chunk", e);
        }
      }
    }

    // 4. Calculate frequencies and update Insights table
    const allTopics = await db
      .select({ topic: questionTopics.topicName })
      .from(questionTopics)
      .innerJoin(questions, eq(questionTopics.questionId, questions.id))
      .where(eq(questions.courseId, courseId));

    const totalCount = allTopics.length;
    const frequencyMap: Record<string, number> = {};
    for (const t of allTopics) {
      frequencyMap[t.topic] = (frequencyMap[t.topic] || 0) + 1;
    }

    // Clear old insights for this course
    await db.delete(examInsights).where(eq(examInsights.courseId, courseId));

    const insightsToInsert = Object.entries(frequencyMap).map(([topic, count]) => ({
      courseId,
      topicName: topic,
      frequencyPercentage: Math.round((count / totalCount) * 100),
    }));

    const newInsights = insightsToInsert.length > 0
      ? await db.insert(examInsights).values(insightsToInsert).returning()
      : [];

    // Sort descending by frequency
    newInsights.sort((a, b) => b.frequencyPercentage - a.frequencyPercentage);

    return NextResponse.json({ insights: newInsights });
  } catch (error) {
    console.error("[POST /api/courses/[courseId]/insights]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;

    const insights = await db
      .select()
      .from(examInsights)
      .where(eq(examInsights.courseId, courseId))
      .orderBy(examInsights.frequencyPercentage);

    return NextResponse.json(insights.reverse());
  } catch (error) {
    console.error("[GET /api/courses/[courseId]/insights]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
