import { NextResponse } from "next/server"
import { db } from "@/database/drizzle"
import { departments, faculty, users } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [userInfo] = await db
    .select({
      id: users.id,
      departmentId: users.departmentId,
      departmentName: departments.name,
      facultyId: faculty.id,
      facultyName: faculty.name,
      level: users.year,
      role: users.role,
      matricNo: users.matricNo,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .innerJoin(departments, eq(users.departmentId, departments.id))
    .innerJoin(faculty, eq(departments.facultyId, faculty.id))

  // Clerk API call removed to improve latency. Frontend uses useUser() for avatar.
  return NextResponse.json({ ...(userInfo ?? {}), imageUrl: null })
}
