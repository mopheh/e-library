export const askDeepSeek = async (
  messages: { role: string; content: string }[]
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
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "moonshotai/kimi-k2:free", // or "moonshot-v1-32k" if you want bigger context
      messages,
    }),
  });

  const data = await res.json();
  console.log(data);
  console.log(data.choices[0].message.content);
  //
  return data.choices?.[0]?.message?.content || "No response.";
};
