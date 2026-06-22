import { withRetry } from "./ai-utils";

/**
 * Generates content using OpenRouter.
 */
export async function generateWithOpenRouter(
  input: string | { role: string; content: string }[],
  model: string = "openrouter/free"
) {
  return withRetry(async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined.");
    }

    let messages;
    if (typeof input === "string") {
      messages = [{ role: "user", content: input }];
    } else {
      // Map Gemini roles to OpenRouter roles (which use standard OpenAI format: system, user, assistant)
      messages = input.map(m => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content
      }));
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_BASE_URL || "http://localhost:3000",
        "X-Title": "RCF",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }, 3, 2000, 60000);
}
