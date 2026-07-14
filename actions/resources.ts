"use server";

import { db } from "@/database/drizzle";
import { 
    resourceRequests, 
    users, 
    notifications, 
    books, 
    departmentCommunities, 
    communityPosts,
    departments
} from "@/database/schema";
import { eq, or, and, desc, inArray } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

/**
 * Fetches resource requests.
 * Admins see all. Faculty Reps see only their department's.
 */
export async function getResourceRequests() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY REP")) {
            throw new Error("Forbidden");
        }

        const conditions = [];
        if (currentUser.role === "FACULTY REP" && currentUser.departmentId) {
            conditions.push(eq(resourceRequests.departmentId, currentUser.departmentId));
        }

        const requests = await db.query.resourceRequests.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                user: true,
                department: true,
                course: true,
            },
            orderBy: [desc(resourceRequests.createdAt)],
            limit: 200,
        });

        if (requests.length > 0) {
            try {
                const clerkIds = requests.map((r) => r.user.clerkId);
                const client = await clerkClient();
                const clerkUsers = await client.users.getUserList({
                    userId: clerkIds,
                    limit: 500,
                });
                const clerkMap = new Map(clerkUsers.data.map((u) => [u.id, u.imageUrl]));
                const mappedRequests = requests.map((r) => ({
                    ...r,
                    user: {
                        ...r.user,
                        imageUrl: clerkMap.get(r.user.clerkId) || null,
                    },
                }));
                return { success: true, data: mappedRequests };
            } catch (err) {
                console.error("Failed to fetch clerk images for resource requests:", err);
            }
        }

        return { success: true, data: requests };
    } catch (error) {
        console.error("Error fetching resource requests:", error);
        return { success: false, error: "Failed to load requests" };
    }
}

/**
 * Fulfills a resource request by providing a link.
 * Link can be from an internal upload or external source.
 */
export async function fulfillResourceRequest(requestId: string, url: string) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY REP")) {
            throw new Error("Forbidden");
        }

        const request = await db.query.resourceRequests.findFirst({
            where: eq(resourceRequests.id, requestId),
            with: {
                course: true,
            }
        });

        if (!request) throw new Error("Request not found");

        // Faculty Rep check: must be their department
        if (currentUser.role === "FACULTY REP" && request.departmentId !== currentUser.departmentId) {
            throw new Error("You can only fulfill requests for your own department.");
        }

        await db.update(resourceRequests)
            .set({
                status: "FULFILLED",
                fulfilledUrl: url,
                updatedAt: new Date(),
            })
            .where(eq(resourceRequests.id, requestId));

        // Create notification for requester
        const [notif] = await db.insert(notifications).values({
            userId: request.userId,
            type: "GENERAL",
            message: `Your resource request for ${request.course.courseCode} has been fulfilled!`,
            targetId: request.id,
        }).returning();

        // Real-time notification (fire-and-forget so a Pusher hiccup doesn't
        // make an already-fulfilled request report back as failed)
        pusherServer
            .trigger(`user-${request.userId}`, "new-notification", notif)
            .catch((err) => console.error("Pusher trigger failed (new-notification):", err));
        pusherServer
            .trigger(`user-${request.userId}`, "resource-fulfilled", { requestId, url })
            .catch((err) => console.error("Pusher trigger failed (resource-fulfilled):", err));

        revalidatePath("/dashboard/manage");
        return { success: true };
    } catch (error) {
        console.error("Error fulfilling resource request:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to fulfill request" };
    }
}

/**
 * Rejects a resource request.
 */
export async function rejectResourceRequest(requestId: string, reason: string) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY REP")) {
            throw new Error("Forbidden");
        }

        await db.update(resourceRequests)
            .set({
                status: "REJECTED",
                updatedAt: new Date(),
            })
            .where(eq(resourceRequests.id, requestId));

        // Notify user
        const request = await db.query.resourceRequests.findFirst({ 
            where: eq(resourceRequests.id, requestId),
            with: { course: true } 
        });
        if (request) {
            await db.insert(notifications).values({
                userId: request.userId,
                type: "GENERAL",
                message: `Your resource request for ${request.course.courseCode} was rejected. Reason: ${reason}`,
            });
        }

        revalidatePath("/dashboard/manage");
        return { success: true };
    } catch (error) {
        console.error("Error rejecting resource request:", error);
        return { success: false, error: "Failed to reject request" };
    }
}

/**
 * Broadcasts an announcement.
 * targetType: "DEPARTMENT" | "FACULTY"
 */
export async function broadcastAnnouncement(content: string, targetType: "DEPARTMENT" | "FACULTY") {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });

        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "FACULTY REP")) {
            throw new Error("Forbidden");
        }

        if (!currentUser.departmentId && currentUser.role === "FACULTY REP") {
            throw new Error("Faculty Rep must have an assigned department.");
        }

        let targetDeptIds: string[] = [];

        if (targetType === "DEPARTMENT") {
            if (currentUser.departmentId) targetDeptIds.push(currentUser.departmentId);
        } else if (targetType === "FACULTY") {
            if (currentUser.facultyId) {
                const depts = await db.query.departments.findMany({
                    where: eq(departments.facultyId, currentUser.facultyId)
                });
                targetDeptIds = depts.map(d => d.id);
            }
        }

        if (targetDeptIds.length === 0) throw new Error("No target departments found.");

        // For each department, find their community and post
        const communities = await db.query.departmentCommunities.findMany({
            where: inArray(departmentCommunities.departmentId, targetDeptIds)
        });

        for (const community of communities) {
            await db.insert(communityPosts).values({
                communityId: community.id,
                authorId: currentUser.id,
                content,
                isPinned: true,
            });
            
            // Trigger pusher for community refresh if needed
            pusherServer
                .trigger(`community-${community.id}`, "new-announcement", { content })
                .catch((err) => console.error("Pusher trigger failed (new-announcement):", err));
        }

        return { success: true, message: `Announcement broadcasted to ${communities.length} communities.` };

    } catch (error) {
        console.error("Error broadcasting announcement:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to broadcast announcement" };
    }
}
