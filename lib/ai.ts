import { generateWithGemini } from "./gemini";
import { generateWithOpenRouter } from "./openrouter";

/** Error codes that indicate a permanent OpenRouter billing / auth problem. */
const OPENROUTER_FATAL_CODES = [401, 402, 403];

/**
 * Unified AI generation with fallback logic.
 * Primary: Gemini. Fallback: OpenRouter (only on transient Gemini rate-limit).
 * OpenRouter billing/auth errors (401/402/403) are treated as non-retryable
 * and will not crash the caller — Gemini remains the sole provider in that case.
 */
export async function generateContent(
  input: string | { role: string; content: string }[],
  model?: string
) {
  try {
    console.log("🤖 Attempting generation with Gemini...");
    return await generateWithGemini(input as any, model);
  } catch (geminiErr: any) {
    const isGeminiRateLimit =
      geminiErr.message?.includes("429") ||
      geminiErr.message?.includes("Quota exceeded") ||
      geminiErr.message?.includes("RESOURCE_EXHAUSTED");

    if (isGeminiRateLimit && process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️ Gemini rate-limited. Falling back to OpenRouter...");
      try {
        return await generateWithOpenRouter(input);
      } catch (orErr: any) {
        // Detect permanent billing / authentication failures — don't re-throw,
        // just log and let the caller decide what to do without crashing.
        const isBillingError = OPENROUTER_FATAL_CODES.some(
          (code) =>
            orErr.message?.includes(String(code)) ||
            orErr.message?.toLowerCase().includes("insufficient credits") ||
            orErr.message?.toLowerCase().includes("unauthorized")
        );

        if (isBillingError) {
          console.warn(
            "⚠️ OpenRouter is unavailable (billing/auth error). Rethrowing original Gemini error."
          );
          // Re-throw the Gemini error so the caller can handle it meaningfully
          throw geminiErr;
        }

        console.error("❌ OpenRouter fallback failed:", orErr.message);
        throw orErr;
      }
    }

    console.error("❌ Gemini generation failed (non-rate-limit):", geminiErr.message);
    throw geminiErr;
  }
}
