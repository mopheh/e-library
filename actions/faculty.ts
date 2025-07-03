"use server";

import { db } from "@/database/drizzle";
import { faculty } from "@/database/schema";
import { eq } from "drizzle-orm";

export const createFaculty = async (data: { faculty: string }) => {
  try {
    if (!data.faculty) throw new Error("Faculty is required");

    const existingFaculty = await db
      .select()
      .from(faculty)
      .where(eq(faculty.name, data.faculty))
      .limit(1);

    if (existingFaculty.length > 0) {
      throw new Error("Faculty already exists");
    }

    await db.insert(faculty).values({ name: data.faculty });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error occurred";
    throw new Error(message);
  }
};
