"use server";

import { db } from "@/database/drizzle";
import { users, departmentCommunities, communityPosts } from "@/database/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getConnectData() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!currentUser) throw new Error("User not found");

    // Fetch verified students in the same department (Mentors/Peers)
    const peers = await db
      .select({
        id: users.id,
        name: users.fullName,
        level: users.year,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          eq(users.departmentId, currentUser.departmentId),
          eq(users.role, "STUDENT"),
          ne(users.id, currentUser.id) // Exclude self
        )
      )
      .limit(10);

    // Fetch recent discussions in the user's department community
    const deptCommunity = await db.query.departmentCommunities.findFirst({
      where: eq(departmentCommunities.departmentId, currentUser.departmentId),
    });

    let recentDiscussions: any[] = [];
    if (deptCommunity) {
      recentDiscussions = await db
        .select({
          id: communityPosts.id,
          content: communityPosts.content,
          createdAt: communityPosts.createdAt,
          authorName: users.fullName,
          authorLevel: users.year,
        })
        .from(communityPosts)
        .innerJoin(users, eq(communityPosts.authorId, users.id))
        .where(eq(communityPosts.communityId, deptCommunity.id))
        .orderBy(desc(communityPosts.createdAt))
        .limit(5);
    }

    return {
      success: true,
      data: {
        peers,
        recentDiscussions,
        departmentId: currentUser.departmentId,
      },
    };
  } catch (error) {
    console.error("Error fetching connect data:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
