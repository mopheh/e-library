// app/api/faculty/route.ts
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { faculty } from "@/database/schema";

export async function GET() {
  try {
    const faculties = await db.select().from(faculty);
    return NextResponse.json(faculties);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch faculties" },
      { status: 500 },
    );
  }
}
