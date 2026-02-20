import OpenAI from "openai";
export const askDeepSeek = async (
  messages: { role: string; content: string }[],
) => {
  // const response = await fetch("https://api.together.xyz/v1/chat/completions", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     model: "deepseek-ai/DeepSeek-R1",
  //     messages,
  //   }),
  // });

  // const data = await response.json();
  //

  // const response = openai.responses.create({
  //   model: "gpt-5-nano",
  //   input: "write a haiku about ai",
  //   store: true,
  // });

  // response.then((result) => console.log(result.output_text));
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages,
      max_tokens: 4096,
    }),
  });

  const data = await res.json();
  console.log(data);
  return data.choices?.[0]?.message?.content || "No response.";
};
