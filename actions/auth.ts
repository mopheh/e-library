"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

export const createUser = async (params: Credentials) => {
  if (!params.email) {
    throw new Error("Missing email");
  }
  const existingMatNo = await db
    .select()
    .from(users)
    .where(eq(users.matricNo, params.matricNo))
    .limit(1);

  if (existingMatNo.length > 0) {
    console.log("Matric Number is taken!!!");
    console.error("Failed to insert user");
    throw new Error("Matric Number is already taken!!!");
  }

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("User Exists already!!!");
      console.error("Failed to insert user");
      throw new Error("User Exists already!!!");
    }
    //@ts-ignore
    await db.insert(users).values(params);
    console.log("user created");
    return true;
  } catch (e) {
    console.error("Failed to insert user:", e);
    throw new Error("Database insert failed");
  }
};
