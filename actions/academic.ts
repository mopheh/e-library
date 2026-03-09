"use server";

import { db } from "@/database/drizzle";
import { faculty, departments } from "@/database/schema";
import { eq } from "drizzle-orm";

export const getFaculties = async () => {
  return await db.select().from(faculty).orderBy(faculty.name);
};

export const getDepartmentsByFaculty = async (facultyId: string) => {
  if (!facultyId) return [];
  return await db.select().from(departments).where(eq(departments.facultyId, facultyId)).orderBy(departments.name);
};
