import { NextResponse } from "next/server"
import { db } from "@/database/drizzle"
import { departments, faculty, users } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  const { userId } = await auth()

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
    .where(userId ? eq(users.clerkId, userId) : undefined)
    .innerJoin(departments, eq(users.departmentId, departments.id))
    .innerJoin(faculty, eq(departments.facultyId, faculty.id))

  let imageUrl = null;
  if (userId) {
      try {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(userId);
          imageUrl = clerkUser.imageUrl;
      } catch (err) {
          console.error("Failed to fetch clerk image for /api/me", err);
      }
  }

  return NextResponse.json({ ...(userInfo ?? {}), imageUrl })
}
