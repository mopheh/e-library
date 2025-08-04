import { getCoursesByDepartment } from "@/actions/course"
import { NextResponse } from "next/server"

export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = context.params
  try {
    const courses = await getCoursesByDepartment(id)
    return NextResponse.json(courses)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
//
