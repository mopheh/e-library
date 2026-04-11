import { withRetry } from "./ai-utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Returns the embeddings for the given text using Gemini.
 * @param text The string to embed
 * @returns An array of numbers representing the vector (768 dimensions)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  return withRetry(async () => {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [{ parts: [{ text }] }],
      outputDimensionality: 768,
    });
    
    return response.embeddings?.[0]?.values || [];
  }, 3, 1000, 30000);
}
