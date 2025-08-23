import { NextRequest, NextResponse } from "next/server"
import { db } from "@/database/drizzle"
import { courses, departmentCourses } from "@/database/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const departmentId = searchParams.get("departmentId")

    const skip = Number(searchParams.get("skip")) || 0
    const limit = Number(searchParams.get("limit")) || 1000

    if (departmentId) {
      const result = await db
        .select({
          id: courses.id,
          courseCode: courses.courseCode,
          title: courses.title,
          unitLoad: courses.unitLoad,
          level: courses.level,
          semester: courses.semester,
          departmentId: courses.departmentId,
        })
        .from(departmentCourses)
        .innerJoin(courses, eq(departmentCourses.courseId, courses.id))
        .where(eq(departmentCourses.departmentId, departmentId))
        .limit(limit)
        .offset(skip)

        console.log(result)

      return NextResponse.json(result)
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
