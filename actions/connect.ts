"use server";

import { db } from "@/database/drizzle";
import { users, departmentCommunities, communityPosts, studentConnections, notifications, departments, chatRooms } from "@/database/schema";
import { eq, desc, and, ne, inArray } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

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
        clerkId: users.clerkId,
        level: users.year,
        role: users.role,
        interests: users.interests,
      })
      .from(users)
      .where(
        and(
          eq(users.departmentId, currentUser.departmentId),
          inArray(users.role, ["STUDENT", "ADMIN", "FACULTY REP"]),
          ne(users.id, currentUser.id) // Exclude self
        )
      )
      .limit(10);

    // Fetch clerk user details to get images
    const clerkIds = peers.map(p => p.clerkId);
    let clerkUserMap = new Map<string, string>();
    
    if (clerkIds.length > 0) {
        try {
            const client = await clerkClient();
            const clerkUsersResp = await client.users.getUserList({
                userId: clerkIds,
                limit: 20,
            });
            clerkUserMap = new Map(clerkUsersResp.data.map(u => [u.id, u.imageUrl]));
        } catch (err) {
            console.error("Failed to fetch clerk images:", err);
        }
    }

    // For each peer, check if a connection request already exists and merge image
    const peersWithStatus = await Promise.all(
        peers.map(async (peer) => {
            const connection = await db.query.studentConnections.findFirst({
                where: and(
                    eq(studentConnections.aspirantId, currentUser.id),
                    eq(studentConnections.studentId, peer.id)
                )
            });
            return { 
                ...peer, 
                imageUrl: clerkUserMap.get(peer.clerkId) || null,
                connectionStatus: connection?.status || null 
            };
        })
    );

    // Fetch recent discussions in the user's department community
    let deptCommunity = await db.query.departmentCommunities.findFirst({
      where: eq(departmentCommunities.departmentId, currentUser.departmentId),
    });

    if (!deptCommunity) {
        // Lazy create the community if it doesn't exist
        const department = await db.query.departments.findFirst({
            where: eq(departments.id, currentUser.departmentId),
        });

        if (department) {
            const created = await db.insert(departmentCommunities).values({
                departmentId: currentUser.departmentId,
                name: `${department.name} Community`,
                description: `A community for the ${department.name} department.`
            }).returning();

            if (created.length > 0) {
                deptCommunity = created[0];
            }
        }
    }

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
        peers: peersWithStatus,
        recentDiscussions,
        departmentId: currentUser.departmentId,
      },
    };
  } catch (error) {
    console.error("Error fetching connect data:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendConnectionRequest(targetStudentId: string) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, userId),
        });

        if (!currentUser) throw new Error("User not found");

        // 1. Check for Mutual Interest (Did the target already send me a request?)
        const mutualRequest = await db.query.studentConnections.findFirst({
            where: and(
                eq(studentConnections.aspirantId, targetStudentId),
                eq(studentConnections.studentId, currentUser.id),
                eq(studentConnections.status, "PENDING")
            )
        });

        if (mutualRequest) {
            // AUTO-ACCEPT: We both want to connect!
            await db.update(studentConnections)
                .set({ status: "ACCEPTED", updatedAt: new Date() })
                .where(eq(studentConnections.id, mutualRequest.id));

            // Notify both parties of a "Match"
            const matchNotif = await db.insert(notifications).values({
                userId: targetStudentId,
                type: "GENERAL",
                message: `It's a match! You are now connected with ${currentUser.fullName}.`,
            }).returning();

            if (matchNotif.length > 0) {
                await pusherServer.trigger(`user-${targetStudentId}`, "new-notification", matchNotif[0]);
            }

            return { success: true, message: "Mutual interest detected! You are now connected." };
        }

        // 2. Check for Cooldown/Existing
        const existing = await db.query.studentConnections.findFirst({
            where: and(
                eq(studentConnections.aspirantId, currentUser.id),
                eq(studentConnections.studentId, targetStudentId)
            )
        });

        if (existing) {
            if (existing.status === "ACCEPTED") return { success: false, error: "Already connected" };
            if (existing.status === "PENDING") return { success: false, error: "Connection request already sent" };
            
            // Rejection Cooldown Logic (7 days)
            if (existing.status === "REJECTED" && existing.updatedAt) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                if (existing.updatedAt > sevenDaysAgo) {
                    return { 
                        success: false, 
                        error: `Cooldown in effect. You can request again in ${Math.ceil((existing.updatedAt.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24))} days.` 
                    };
                }

                // If cooldown expired, we reset the request to pending
                await db.update(studentConnections)
                    .set({ status: "PENDING", updatedAt: new Date() })
                    .where(eq(studentConnections.id, existing.id));
                
                return { success: true };
            }
        }

        const connection = await db.insert(studentConnections).values({
            aspirantId: currentUser.id,
            studentId: targetStudentId,
            status: "PENDING",
        }).returning();

        // Trigger Notification
        if (connection.length > 0) {
            const newNotif = await db.insert(notifications).values({
                userId: targetStudentId,
                type: "CONNECTION_REQUEST",
                message: `${currentUser.fullName} wants to connect with you.`,
                targetId: connection[0].id,
            }).returning();

            if (newNotif.length > 0) {
                await pusherServer.trigger(`user-${targetStudentId}`, "new-notification", newNotif[0]);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending connection request:", error);
        return { success: false, error: "Failed to send request" };
    }
}

export async function respondToConnectionRequest(connectionId: string, status: "ACCEPTED" | "REJECTED") {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!currentUser) throw new Error("User not found");

        const connection = await db.query.studentConnections.findFirst({
            where: eq(studentConnections.id, connectionId),
        });

        if (!connection || connection.studentId !== currentUser.id) {
            throw new Error("Unauthorized or connection not found");
        }

        await db.update(studentConnections)
            .set({ status, updatedAt: new Date() })
            .where(eq(studentConnections.id, connectionId));

        // Notify the requester and create a chat room
        if (status === "ACCEPTED") {
            const requester = await db.query.users.findFirst({
                where: eq(users.id, connection.aspirantId),
            });

            if (requester) {
                // Ensure room exists
                const [u1, u2] = [currentUser.id, requester.id].sort();
                
                try {
                    await db.insert(chatRooms).values({
                        userOneId: u1,
                        userTwoId: u2,
                    }).onConflictDoNothing();
                } catch (err) {
                    console.error("Chat room creation failed:", err);
                }

                const newNotif = await db.insert(notifications).values({
                    userId: requester.id,
                    type: "GENERAL",
                    message: `${currentUser.fullName} accepted your connection request!`,
                }).returning();

                if (newNotif.length > 0) {
                    await pusherServer.trigger(`user-${requester.id}`, "new-notification", newNotif[0]);
                    await pusherServer.trigger(`user-${requester.id}`, "connection-accepted", { peerId: currentUser.id });
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error responding to connection request:", error);
        return { success: false, error: "Failed to respond to request" };
    }
}

export async function createDiscussionPost(content: string) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!currentUser) throw new Error("User not found");

        let deptCommunity = await db.query.departmentCommunities.findFirst({
            where: eq(departmentCommunities.departmentId, currentUser.departmentId),
        });

        if (!deptCommunity) {
            // Lazy create the community if it doesn't exist
            const department = await db.query.departments.findFirst({
                where: eq(departments.id, currentUser.departmentId),
            });

            if (!department) throw new Error("Department not found");

            const created = await db.insert(departmentCommunities).values({
                departmentId: currentUser.departmentId,
                name: `${department.name} Community`,
                description: `A community for the ${department.name} department.`
            }).returning();

            if (created.length === 0) throw new Error("Failed to create department community");
            deptCommunity = created[0];
        }

        const newPost = await db.insert(communityPosts).values({
            communityId: deptCommunity.id,
            authorId: currentUser.id,
            content: content,
        }).returning();

        if (newPost.length > 0) {
            const postWithAuthor = {
                ...newPost[0],
                authorName: currentUser.fullName,
                authorLevel: currentUser.year,
            };
            
            // Trigger Pusher for the entire department community
            await pusherServer.trigger(`dept-community-${deptCommunity.id}`, "new-post", postWithAuthor);
        }

        return { success: true };
    } catch (error) {
        console.error("Error creating discussion post:", error);
        return { success: false, error: "Failed to create post" };
    }
}

export async function updateUserInterests(interests: string) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        await db.update(users)
            .set({ interests })
            .where(eq(users.clerkId, clerkId));

        return { success: true };
    } catch (error) {
        console.error("Error updating interests:", error);
        return { success: false, error: "Failed to update profile" };
    }
}
