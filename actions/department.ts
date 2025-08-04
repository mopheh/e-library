"use server"
import { db } from "@/database/drizzle"
import { departments, faculty } from "@/database/schema"
import { eq } from "drizzle-orm"

type Department = {
  name: string
  faculty: string
}
export const createDepartment = async (data: Department) => {
  try {
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.name, data.name))
      .limit(1)
    if (existing.length > 0) {
      throw new Error("Department already exists")
    }
    await db.insert(departments).values({
      name: data.name,
      facultyId: data.faculty,
    })
  } catch (err: any) {
    throw new Error(err.message || "Error creating departments")
  }
}
export const getDepartmentWithFaculty = async (departmentId: string) => {
  const result = await db
    .select({
      departmentName: departments.name,
      facultyName: faculty.name,
      facultyId: faculty.id,
    })
    .from(departments)
    .innerJoin(faculty, eq(departments.facultyId, faculty.id))
    .where(eq(departments.id, departmentId))
    .limit(1)

  return result[0] // or handle null result
}
