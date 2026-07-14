"use server";

import { db } from "@/database/drizzle";
import { departments, books, users, courses, faculty } from "@/database/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getFacultiesWithStats() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const facultiesWithCount = await db
      .select({
        id: faculty.id,
        name: faculty.name,
        departmentCount: sql<number>`count(${departments.id})`,
      })
      .from(faculty)
      .leftJoin(departments, eq(departments.facultyId, faculty.id))
      .groupBy(faculty.id, faculty.name)
      .orderBy(faculty.name);

    return {
      success: true,
      data: facultiesWithCount.map(f => ({
        ...f,
        departmentCount: Number(f.departmentCount || 0)
      })),
    };
  } catch (error) {
    console.error("Error fetching faculties with stats:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getDepartmentsOfFaculty(facultyId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const depts = await db
      .select()
      .from(departments)
      .where(eq(departments.facultyId, facultyId))
      .orderBy(departments.name);

    // Single grouped query per stat instead of two round trips per department.
    const deptIds = depts.map((d) => d.id);
    const [booksCounts, studentsCounts] = deptIds.length > 0
      ? await Promise.all([
          db
            .select({ departmentId: books.departmentId, count: sql<number>`count(*)` })
            .from(books)
            .where(inArray(books.departmentId, deptIds))
            .groupBy(books.departmentId),
          db
            .select({ departmentId: users.departmentId, count: sql<number>`count(*)` })
            .from(users)
            .where(sql`${users.departmentId} IN ${deptIds} AND ${users.role} = 'STUDENT'`)
            .groupBy(users.departmentId),
        ])
      : [[], []];
    const booksCountByDept = new Map(booksCounts.map((r) => [r.departmentId, Number(r.count)]));
    const studentsCountByDept = new Map(studentsCounts.map((r) => [r.departmentId, Number(r.count)]));

    const deptsWithStats = depts.map((dept) => ({
      id: dept.id,
      name: dept.name,
      facultyId: dept.facultyId,
      stats: {
        booksCount: booksCountByDept.get(dept.id) || 0,
        studentsCount: studentsCountByDept.get(dept.id) || 0,
      },
    }));

    return {
      success: true,
      data: deptsWithStats,
    };
  } catch (error) {
    console.error("Error fetching departments of faculty:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


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
