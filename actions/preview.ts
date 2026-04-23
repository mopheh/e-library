"use server";

import { db } from "@/database/drizzle";
import { departments, books, users, courses } from "@/database/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getDepartmentPreview(departmentId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Fetch department details
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
    });

    if (!dept) throw new Error("Department not found");

    // Count recommended texts (books associated with department)
    const booksCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(eq(books.departmentId, departmentId));
      
    const recommendedTextsCount = Number(booksCountResult[0]?.count || 0);

    // Count current students in the department
    const studentsCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        sql`${users.departmentId} = ${departmentId} AND ${users.role} = 'STUDENT'`
      );

    const currentStudentsCount = Number(studentsCountResult[0]?.count || 0);

    // Try to get some core 100 level courses for preview
    const coreCourses = await db.select({
       title: courses.title
    })
    .from(courses)
    .where(
      sql`${courses.departmentId} = ${departmentId} AND ${courses.level} = '100'`
    )
    .limit(6);

    return {
      success: true,
      data: {
        department: dept,
        stats: {
          recommendedTexts: recommendedTextsCount,
          pastQuestions: 150, // Hardcoded for now until exact PQ logic is defined
          currentStudents: currentStudentsCount,
        },
        coreCourses: coreCourses.map(c => c.title),
      }
    };
  } catch (error) {
    console.error("Error fetching department preview:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
