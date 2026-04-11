import { generateWithGemini, GeminiMessage } from "@/lib/gemini";

export const askDeepSeek = async (
  messages: { role: string; content: string }[],
) => {
  try {
    const geminiMessages: GeminiMessage[] = messages.map(m => ({
      role: m.role === "assistant" ? "model" : (m.role as "user" | "system"),
      content: m.content
    }));

    const response = await generateWithGemini(geminiMessages);
    return response || "No response.";
  } catch (error) {
    console.error("Gemini fallback error:", error);
    return "The AI assistant is currently unavailable. Please try again later.";
  }
};
