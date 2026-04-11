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

/**
 * Enforces role-based access control for API routes. 
 * Use this wrapper to block unauthorized roles.
 */
export async function requireRole(allowedRoles: ("STUDENT" | "ADMIN" | "FACULTY REP" | "ASPIRANT")[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }
  
  if (!allowedRoles.includes(user.role as any)) {
    return { authorized: false, error: "Forbidden: Insufficient Permissions", status: 403 };
  }
  
  return { authorized: true, user, status: 200 };
}
