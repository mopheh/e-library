import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/drizzle"
import { departments } from "@/database/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const facultyId = searchParams.get("facultyId")
    const departmentId = searchParams.get("departmentId")
    const skip = Number(searchParams.get("skip")) || 0
    const limit = Number(searchParams.get("limit")) || 1000
    if (facultyId) {
      const filterDepartments = await db
        .select()
        .from(departments)
        .where(eq(departments.facultyId, facultyId))
        .limit(limit)
        .offset(skip)
      return NextResponse.json(filterDepartments)
    }
    if (departmentId) {
      const department = await db
        .select()
        .from(departments)
        .where(eq(departments.id, departmentId))
      return NextResponse.json(department)
    }
    // Case: Fetch all departments
    const allDepartments = await db
      .select()
      .from(departments)
      .limit(limit)
      .offset(skip)
    return NextResponse.json(allDepartments)
  } catch (error) {
    console.error("[GET /api/departments]", error)
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    )
  }
}
