"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Syncs the current user's database role and onboarding status to Clerk publicMetadata.
 * This is used to fix users who are stuck in an onboarding loop because of missing metadata.
 */
export async function syncUserMetadata() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      return { success: false, error: "User profile not found in database" };
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        onboarded: true,
        role: dbUser.role || "STUDENT",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error syncing user metadata:", error);
    return { success: false, error: "Failed to sync metadata" };
  }
}
