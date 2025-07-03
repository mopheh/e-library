"use server";
import { db } from "@/database/drizzle";
import { departments } from "@/database/schema";
import { eq } from "drizzle-orm";

type Department = {
  name: string;
  faculty: string;
};
export const createDepartment = async (data: Department) => {
  try {
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.name, data.name))
      .limit(1);
    if (existing.length > 0) {
      throw new Error("Department already exists");
    }
    await db.insert(departments).values({
      name: data.name,
      facultyId: data.faculty,
    });
  } catch (err: any) {
    throw new Error(err.message || "Error creating departments");
  }
};
