import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");

    if (facultyId) {
      // Case: Filtered by facultyId
      const filterUsers = await db
        .select()
        .from(users)
        .where(eq(users.facultyId, facultyId));
      return NextResponse.json(filterUsers);
    }

    // Case: Fetch all departments
    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
