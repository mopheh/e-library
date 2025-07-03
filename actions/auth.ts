"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

export const createUser = async (params: Credentials) => {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("User Exists already!!!");
      return existingUser[0];
    }

    await db.insert(users).values(params);
    console.log("user created");
    return true;
  } catch (e) {
    console.error("Failed to insert user:", e);
    throw new Error("Database insert failed");
  }
};
