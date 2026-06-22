import { generateWithOpenRouter } from "@/lib/openrouter";
import { generateWithGemini } from "@/lib/gemini";

export const askOpenRouter = async (
  messages: { role: string; content: string }[],
) => {
  try {
    console.log("🤖 Attempting request with primary OpenRouter free model...");
    // Use the default model (which we set to openrouter/free)
    const response = await generateWithOpenRouter(messages);
    return response || "No response.";
  } catch (error: any) {
    console.warn("⚠️ OpenRouter API failed. Attempting fallback with Gemini 2.5...", error.message || error);
    
    try {
      // Clean roles for Gemini format compatibility
      const geminiMessages = messages.map(m => ({
        role: m.role === "assistant" ? "model" as const : m.role as "user" | "model" | "system",
        content: m.content
      }));
      const fallbackResponse = await generateWithGemini(geminiMessages);
      if (fallbackResponse) {
        console.log("✅ OpenRouter fallback to Gemini succeeded!");
        return fallbackResponse;
      }
    } catch (geminiError: any) {
      console.error("❌ All AI fallbacks failed:", geminiError.message || geminiError);
    }

    // If we exhausted rate limits or credits on primary
    if (error.message?.includes("429") || error.message?.includes("Quota exceeded") || error.message?.includes("402")) {
      return "I'm currently receiving too many requests. Please wait about 30 seconds and ask again!";
    }

    return "The AI assistant is currently unavailable. Please try again later.";
  }
};
