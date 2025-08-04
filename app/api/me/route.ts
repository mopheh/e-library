import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { departments, faculty, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  const [userInfo] = await db
    .select({
      departmentId: users.departmentId,
      departmentName: departments.name,
      facultyId: faculty.id,
      facultyName: faculty.name,
      level: users.year,
    })
    .from(users)
    .where(eq(users.clerkId, userId))
    .innerJoin(departments, eq(users.departmentId, departments.id))
    .innerJoin(faculty, eq(departments.facultyId, faculty.id));

  return NextResponse.json(userInfo ?? {});
}
