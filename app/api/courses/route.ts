import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/drizzle"
import { courses } from "@/database/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get("departmentId")

    const skip = Number(searchParams.get("skip")) || 0
    const limit = Number(searchParams.get("limit")) || 1000

    if (departmentId) {
      const filterCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.departmentId, departmentId))
        .limit(limit)
        .offset(skip)
      return NextResponse.json(filterCourses)
    }

    // Case: Fetch all departments
    const allCourses = await db.select().from(courses)
    return NextResponse.json(allCourses)
  } catch (error) {
    console.error("[GET /api/departments]", error)
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    )
  }
}
