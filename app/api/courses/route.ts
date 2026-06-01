import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { courses, courseDepartments } from "@/database/schema";
import { eq, or, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const includeBorrowed = searchParams.get("includeBorrowed") === "true";

    const skip = Number(searchParams.get("skip")) || 0;
    const limit = Number(searchParams.get("limit")) || 1000;

    if (departmentId) {
      if (includeBorrowed) {
        // Return courses owned by this dept AND courses borrowed by this dept
        // Step 1: get IDs of courses borrowed via course_departments
        const borrowedRows = await db
          .select({ courseId: courseDepartments.courseId })
          .from(courseDepartments)
          .where(eq(courseDepartments.departmentId, departmentId));

        const borrowedIds = borrowedRows.map((r) => r.courseId);

        // Step 2: fetch owned courses + borrowed courses (union via OR / inArray)
        const result =
          borrowedIds.length > 0
            ? await db
                .select()
                .from(courses)
                .where(
                  or(
                    eq(courses.departmentId, departmentId),
                    inArray(courses.id, borrowedIds),
                  ),
                )
                .limit(limit)
                .offset(skip)
            : await db
                .select()
                .from(courses)
                .where(eq(courses.departmentId, departmentId))
                .limit(limit)
                .offset(skip);

        return NextResponse.json(result);
      }

      // Default: only owned courses
      const result = await db
        .select()
        .from(courses)
        .where(eq(courses.departmentId, departmentId))
        .limit(limit)
        .offset(skip);

      return NextResponse.json(result);
    }

    // No departmentId — return all courses
    const allCourses = await db.select().from(courses);
    return NextResponse.json(allCourses);
  } catch (error) {
    console.error("[GET /api/courses]", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}
