export const askDeepSeek = async (
  messages: { role: string; content: string }[],
) => {
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-R1",
      messages,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response.";
};
