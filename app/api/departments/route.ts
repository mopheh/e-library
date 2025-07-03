import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { departments } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");

    if (facultyId) {
      // Case: Filtered by facultyId
      const filterDepartments = await db
        .select()
        .from(departments)
        .where(eq(departments.facultyId, facultyId));
      return NextResponse.json(filterDepartments);
    }

    // Case: Fetch all departments
    const allDepartments = await db.select().from(departments);
    return NextResponse.json(allDepartments);
  } catch (error) {
    console.error("[GET /api/departments]", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 },
    );
  }
}
