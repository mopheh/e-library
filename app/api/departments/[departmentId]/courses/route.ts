// import { getCoursesByDepartment } from "@/actions/course"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    return NextResponse.json({ message: "success" })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
