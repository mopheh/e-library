"use server";

import { db } from "@/database/drizzle";
import { courses } from "@/database/schema";
import { eq } from "drizzle-orm";

type Courses = {
  courseCode: string;
  title: string;
  departmentId: string;
  unitLoad: number;
  semester: string;
  level: string;
  departments: string[];
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
    await db.insert(courses).values({
      courseCode: data.courseCode,
      title: data.title,
      departmentId: data.departmentId,
      unitLoad: data.unitLoad,
      semester: data.semester as any,
      level: data.level as any,
    });
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

