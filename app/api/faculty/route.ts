// app/api/faculty/route.ts
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { faculty } from "@/database/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = Number(searchParams.get("skip")) || 0;
  const limit = Number(searchParams.get("limit")) || 5;

  try {
    const faculties = await db.select().from(faculty).limit(limit).offset(skip);

    return NextResponse.json(faculties);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch faculties" },
      { status: 500 },
    );
  }
}
