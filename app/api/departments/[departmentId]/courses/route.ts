// import { getCoursesByDepartment } from "@/actions/course"
import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs";

export async function GET(req: Request) {
  try {
    return NextResponse.json({ message: "success" })
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
