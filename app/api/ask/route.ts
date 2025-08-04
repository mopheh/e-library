// app/api/deepseek/route.ts
import { NextRequest, NextResponse } from "next/server";
import { askDeepSeek } from "@/actions/deepseek";
export async function POST(req: NextRequest) {
  const body = await req.json();
  const response = await askDeepSeek(body.messages);
  const cleaned = response.replace(/<think>[\s\S]*?<\/think>/, "").trim();
  console.log(cleaned);
  return NextResponse.json({ response: cleaned });
}
