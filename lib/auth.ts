import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { invalidateCache, withCache } from "@/lib/redis";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cache } from "react";

// Every authenticated API call resolves the signed-in user, so this lookup
// is the single most frequent query in the app. Cache it briefly in Redis;
// every write to `users` calls invalidateUserCache() so role/department
// changes still apply immediately.
const USER_TTL_SECS = 60;
const userKey = (clerkId: string) => `user:clerk:${clerkId}`;

type UserRow = typeof users.$inferSelect;

export const getCurrentUser = cache(async (): Promise<UserRow | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const row = await withCache(userKey(userId), USER_TTL_SECS, async () => {
    const result = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    return result[0] ?? null;
  });
  if (!row) return null;
  // JSON round-trip through Redis turns timestamps into strings
  return { ...row, createdAt: row.createdAt ? new Date(row.createdAt) : null };
});

/**
 * Drop cached copies of a user (getCurrentUser + /api/me). Call after any
 * write to the users table. Accepts whichever identifier the caller has.
 */
export async function invalidateUserCache(by: { clerkId?: string | null; userId?: string | null; email?: string | null }) {
  let clerkId = by.clerkId ?? null;
  if (!clerkId && (by.userId || by.email)) {
    const [row] = await db
      .select({ clerkId: users.clerkId })
      .from(users)
      .where(by.userId ? eq(users.id, by.userId) : eq(users.email, by.email!))
      .limit(1);
    clerkId = row?.clerkId ?? null;
  }
  if (clerkId) await invalidateCache(userKey(clerkId), `me:${clerkId}`);
}

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
