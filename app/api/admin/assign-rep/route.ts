import { db } from "@/database/drizzle";
import { users, auditLogs, notifications } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const adminUser = await getCurrentUser();
    
    // Authorization Check: Only ADMIN can assign FACULTY REP
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userIdToAssign } = await req.json();

    if (!userIdToAssign) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 0. Fetch the target user
    const [userToAssign] = await db
        .select()
        .from(users)
        .where(eq(users.id, userIdToAssign));
        
    if (!userToAssign) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Enforce Max 2 Reps limit
    const existingReps = await db
        .select()
        .from(users)
        .where(
            and(
                eq(users.facultyId, userToAssign.facultyId),
                eq(users.role, "FACULTY REP")
            )
        );

    if (existingReps.length >= 2) {
         return NextResponse.json({ error: "This faculty already has the maximum of 2 representatives." }, { status: 400 });
    }

    const repType = existingReps.length === 0 ? "Head Rep" : "Assistant Rep";

    // 2. Update User Role in DB
    const [updatedUser] = await db
      .update(users)
      .set({ role: "FACULTY REP" })
      .where(eq(users.id, userIdToAssign))
      .returning();

    // 3. Log Action
    await db.insert(auditLogs).values({
      actionType: "ASSIGN_FACULTY_REP",
      targetId: updatedUser.id,
      performedBy: adminUser.id,
      details: {
        assignedUserEmail: updatedUser.email,
        assignedUserFacultyId: updatedUser.facultyId,
        repType: repType
      },
    });

    // 4. Update Clerk User Metadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(updatedUser.clerkId, {
      unsafeMetadata: {
        role: "faculty-rep",
        repType: repType
      }
    });

    // 5. Save Notification
    const [newNotification] = await db.insert(notifications).values({
        userId: updatedUser.id,
        type: "SYSTEM",
        message: `You have been assigned as the Faculty Representative for your faculty.`,
    }).returning();

    // 4. Trigger Real-time Event
    try {
        await pusherServer.trigger(
            `user-${updatedUser.id}`,
            "new-notification",
            newNotification
        );
    } catch (pusherError) {
        console.error("Failed to trigger Pusher event:", pusherError);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error assigning faculty rep:", error);
    return NextResponse.json(
      { error: "Failed to assign faculty rep" },
      { status: 500 }
    );
  }
}
