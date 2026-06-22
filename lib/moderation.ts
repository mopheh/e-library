import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function moderateText(text: string): Promise<{
  flagged: boolean;
  reason?: string;
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY missing. Skipping moderation.");
      return { flagged: false };
    }

    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];

    if (result.flagged) {
      const reasons = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category)
        .join(", ");
      
      return { flagged: true, reason: reasons };
    }

    return { flagged: false };
  } catch (error) {
    console.error("Moderation API Error:", error);
    // On API error, fail open to not block users if OpenAI is down,
    // but log it extensively.
    return { flagged: false };
  }
}
