"use server";

import { db } from "@/database/drizzle";
import { courses, courseDepartments } from "@/database/schema";
import { eq } from "drizzle-orm";

type Courses = {
  courseCode: string;
  title: string;
  departmentId: string;
  unitLoad: number;
  semester: string;
  level: string;
  departments: string[]; // borrowing department IDs
};

export const createCourses = async (data: Courses) => {
  try {
    if (!data) throw new Error("Course is required");

    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.courseCode, data.courseCode))
      .limit(1);

    if (existingCourse.length > 0) {
      throw new Error("Course already exists");
    }

    // @ts-ignore
    const [newCourse] = await db
      .insert(courses)
      .values({
        courseCode: data.courseCode,
        title: data.title,
        departmentId: data.departmentId,
        unitLoad: data.unitLoad,
        semester: data.semester as any,
        level: data.level as any,
      })
      .returning({ id: courses.id });

    // Insert borrowing departments into the junction table
    if (data.departments && data.departments.length > 0) {
      const rows = data.departments
        .filter((dId) => dId !== data.departmentId) // exclude owner dept (optional de-dup)
        .map((departmentId) => ({
          courseId: newCourse.id,
          departmentId,
        }));

      if (rows.length > 0) {
        await db.insert(courseDepartments).values(rows);
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error occurred";
    throw new Error(message);
  }
};

export const getCoursesByDepartment = async (departmentId: string) => {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      courseCode: courses.courseCode,
    })
    .from(courses)
    .where(eq(courses.departmentId, departmentId));
};

/** Replace all borrowing departments for a course */
export const updateCourseDepartments = async (
  courseId: string,
  departmentIds: string[],
) => {
  // Delete existing entries
  await db
    .delete(courseDepartments)
    .where(eq(courseDepartments.courseId, courseId));

  if (departmentIds.length === 0) return;

  await db.insert(courseDepartments).values(
    departmentIds.map((departmentId) => ({ courseId, departmentId })),
  );
};

/** Get the list of borrowing department IDs for a course */
export const getCourseDepartments = async (courseId: string) => {
  const rows = await db
    .select({ departmentId: courseDepartments.departmentId })
    .from(courseDepartments)
    .where(eq(courseDepartments.courseId, courseId));
  return rows.map((r) => r.departmentId);
};
