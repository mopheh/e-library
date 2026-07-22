import { GoogleGenAI } from "@google/genai";
import { withRetry } from "./ai-utils";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export type GeminiMessage = {
  role: "user" | "model" | "system" | "assistant";
  content: string;
};

/**
 * Generates content using Gemini universal SDK with auto-retries.
 */
export async function generateWithGemini(
  input: string | GeminiMessage[],
  // Pinned - "gemini-flash-latest" now aliases to gemini-3.6-flash, whose
  // free tier is capped at 20 requests/day/project (see generateQuestions.ts).
  model: string = "gemini-2.5-flash"
) {
  return withRetry(async () => {
    const ai = getAI();

    if (typeof input === "string") {
      const result = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: input }] }]
      });
      return result.text || "";
    }

    // Convert message array to Gemini Universal format
    const systemInstruction = input.find(m => m.role === "system")?.content;
    const contents = input
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" || m.role === "model" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemInstruction || undefined,
      }
    });

    return result.text || "";
  }, 3, 1000, 30000);
}

/**
 * Generates an AsyncGenerator stream using Gemini universal SDK.
 */
export async function* generateStreamWithGemini(
  input: string | GeminiMessage[],
  model: string = "gemini-2.5-flash"
) {
  const ai = getAI();

  if (typeof input === "string") {
    const resultStream = await ai.models.generateContentStream({
      model,
      contents: [{ parts: [{ text: input }] }]
    });
    for await (const chunk of resultStream) {
      if (chunk.text) yield chunk.text;
    }
    return;
  }

  // Convert message array to Gemini Universal format
  const systemInstruction = input.find(m => m.role === "system")?.content;
  const contents = input
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" || m.role === "model" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

  const resultStream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: systemInstruction || undefined,
    }
  });

  for await (const chunk of resultStream) {
    if (chunk.text) yield chunk.text;
  }
}
