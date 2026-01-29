import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  return result[0] ?? null;
});
