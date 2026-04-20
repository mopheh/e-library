import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { generateWithGemini } from "../lib/gemini";

async function test() {
  console.log("🧪 Testing Gemini Question Generation...");
  
  const prompt = `
You are an exam question generator for a textbook. Your task is to create 1 multiple-choice question from the following text.

Instructions:
1. Format output as strict JSON:
[
  {
    "questionText": "...",
    "type": "mcq",
    "options": [
      { "optionText": "...", "isCorrect": false },
      { "optionText": "...", "isCorrect": true },
      { "optionText": "...", "isCorrect": false },
      { "optionText": "...", "isCorrect": false }
    ]
  }
]

Text: Energy is the basic necessity for the economic development of a country. Many functions necessary to present-day living grind to halt when the supply of energy stops.
`;

  try {
    const response = await generateWithGemini(prompt, "gemini-2.0-flash");
    console.log("--- RAW RESPONSE ---");
    console.log(response);
    console.log("--------------------");
    
    const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log("✅ Successfully parsed JSON:", JSON.stringify(parsed, null, 2));
  } catch (err: any) {
    console.error("❌ Test failed:", err.message);
  }
}

test();
