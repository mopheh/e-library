import { generateWithGemini } from "./gemini";
import { generateWithOpenRouter } from "./openrouter";

/**
 * Unified AI generation with fallback logic.
 * Tries Gemini first, falls back to OpenRouter if Gemini hits rate limits or fails.
 */
export async function generateContent(input: string | { role: string; content: string }[], model?: string) {
  try {
    console.log("🤖 Attempting generation with Gemini...");
    return await generateWithGemini(input as any, model);
  } catch (err: any) {
    const isRateLimit = err.message?.includes("429") || err.message?.includes("Quota exceeded") || err.message?.includes("RESOURCE_EXHAUSTED");
    
    if (isRateLimit && process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️ Gemini rate limit reached. Falling back to OpenRouter...");
      try {
        return await generateWithOpenRouter(input);
      } catch (orErr: any) {
        console.error("❌ OpenRouter fallback failed:", orErr.message);
        throw orErr;
      }
    }
    
    console.error("❌ Gemini generation failed:", err.message);
    throw err;
  }
}
