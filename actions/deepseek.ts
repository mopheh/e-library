import { generateContent } from "@/lib/ai";

export const askDeepSeek = async (
  messages: { role: string; content: string }[],
) => {
  try {
    // generateContent automatically maps roles inside lib/openrouter and lib/gemini
    const response = await generateContent(messages);
    return response || "No response.";
  } catch (error: any) {
    console.error("Gemini fallback error:", error);
    
    // If we exhausted both Gemini rate limits and OpenRouter credits
    if (error.message?.includes("429") || error.message?.includes("Quota exceeded") || error.message?.includes("402")) {
      return "I'm currently receiving too many requests. Please wait about 30 seconds and ask again!";
    }

    return "The AI assistant is currently unavailable. Please try again later.";
  }
};
