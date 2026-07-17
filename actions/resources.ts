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

/** Faculty Reps operate faculty-wide (all departments in their faculty), not just their own department. */
async function departmentIdsForFacultyRep(currentUser: { facultyId: string | null }): Promise<string[]> {
    if (!currentUser.facultyId) return [];
    const depts = await db.select({ id: departments.id }).from(departments).where(eq(departments.facultyId, currentUser.facultyId));
    return depts.map((d) => d.id);
}

/**
 * Creates a resource request for the current user's own department.
 * Notifies the Faculty Reps covering that department's faculty (and admins,
 * via their own view).
 */
export async function createResourceRequest(courseId: string, description: string) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
        });
        if (!currentUser) throw new Error("User not found");
        if (!currentUser.departmentId) throw new Error("Your account has no assigned department.");

        if (!courseId) throw new Error("Please select a course.");
        const trimmedDescription = description.trim();
        if (trimmedDescription.length < 10) throw new Error("Please describe what you need in a bit more detail.");

        const course = await db.query.courses.findFirst({ where: (c, { eq }) => eq(c.id, courseId) });
        if (!course) throw new Error("Course not found");

        const [request] = await db.insert(resourceRequests).values({
            userId: currentUser.id,
            departmentId: currentUser.departmentId,
            courseId,
            description: trimmedDescription,
        }).returning();

        // Notify the Faculty Reps covering this department's faculty (a rep's
        // own departmentId is just where they were onboarded -- their actual
        // scope is faculty-wide).
        const reps = currentUser.facultyId
            ? await db.query.users.findMany({
                where: and(eq(users.facultyId, currentUser.facultyId), eq(users.role, "FACULTY REP")),
            })
            : [];

        for (const rep of reps) {
            const [notif] = await db.insert(notifications).values({
                userId: rep.id,
                type: "GENERAL",
                message: `${currentUser.fullName} requested material for ${course.courseCode}.`,
                targetId: request.id,
            }).returning();

            pusherServer
                .trigger(`user-${rep.id}`, "new-notification", notif)
                .catch((err) => console.error("Pusher trigger failed (new-notification):", err));
        }

        revalidatePath("/dashboard/requests");
        return { success: true, data: request };
    } catch (error) {
        console.error("Error creating resource request:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to submit request" };
    }
}

/**
 * Fetches resource requests.
 * Admins see all. Faculty Reps see every department in their own faculty.
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
        if (currentUser.role === "FACULTY REP") {
            const deptIds = await departmentIdsForFacultyRep(currentUser);
            conditions.push(inArray(resourceRequests.departmentId, deptIds.length ? deptIds : ["00000000-0000-0000-0000-000000000000"]));
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

        // Faculty Rep check: must be a department in their faculty
        if (currentUser.role === "FACULTY REP") {
            const deptIds = await departmentIdsForFacultyRep(currentUser);
            if (!deptIds.includes(request.departmentId)) {
                throw new Error("You can only fulfill requests for departments in your own faculty.");
            }
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

        const request = await db.query.resourceRequests.findFirst({
            where: eq(resourceRequests.id, requestId),
            with: { course: true }
        });
        if (!request) throw new Error("Request not found");

        // Faculty Rep check: must be a department in their faculty
        if (currentUser.role === "FACULTY REP") {
            const deptIds = await departmentIdsForFacultyRep(currentUser);
            if (!deptIds.includes(request.departmentId)) {
                throw new Error("You can only reject requests for departments in your own faculty.");
            }
        }

        await db.update(resourceRequests)
            .set({
                status: "REJECTED",
                updatedAt: new Date(),
            })
            .where(eq(resourceRequests.id, requestId));

        // Notify user
        {
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
