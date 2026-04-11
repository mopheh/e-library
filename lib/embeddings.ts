import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Returns the embeddings for the given text using Gemini.
 * @param text The string to embed
 * @returns An array of numbers representing the vector (768 dimensions for text-embedding-004)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    
    return response.embeddings?.[0]?.values || [];
  } catch (err) {
    console.error("Failed to generate embedding for text", err);
    return [];
  }
}
