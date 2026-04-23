import { db } from "@/database/drizzle";
import { users, auditLogs, notifications } from "@/database/schema";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const assignRepSchema = z.object({
  userIdToAssign: z.string().uuid("userIdToAssign must be a valid UUID"),
});

export async function POST(req: Request) {
  try {
    // RBAC: Only ADMIN can assign FACULTY REP
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const adminUser = authCheck.user!;

    const result = assignRepSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { userIdToAssign } = result.data;

    // Fetch the target user
    const [userToAssign] = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdToAssign))
      .limit(1);

    if (!userToAssign) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Enforce max 2 reps per faculty
    const existingReps = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.facultyId, userToAssign.facultyId), eq(users.role, "FACULTY REP")));

    if (existingReps.length >= 2) {
      return NextResponse.json(
        { error: "This faculty already has the maximum of 2 representatives." },
        { status: 400 },
      );
    }

    const repType = existingReps.length === 0 ? "Head Rep" : "Assistant Rep";

    // Update role in DB
    const [updatedUser] = await db
      .update(users)
      .set({ role: "FACULTY REP" })
      .where(eq(users.id, userIdToAssign))
      .returning();

    // Log action to audit_logs
    await db.insert(auditLogs).values({
      actionType: "ASSIGN_FACULTY_REP",
      targetId: updatedUser.id,
      performedBy: adminUser.id,
      details: {
        assignedUserEmail: updatedUser.email,
        assignedUserFacultyId: updatedUser.facultyId,
        repType,
      },
    });

    // Update Clerk metadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(updatedUser.clerkId, {
      unsafeMetadata: { role: "faculty-rep", repType },
    });

    // Save notification
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId: updatedUser.id,
        type: "SYSTEM",
        message: "You have been assigned as the Faculty Representative for your faculty.",
      })
      .returning();

    // Trigger real-time Pusher event
    try {
      await pusherServer.trigger(`user-${updatedUser.id}`, "new-notification", newNotification);
    } catch (pusherError) {
      console.error("[assign-rep] Pusher trigger failed:", pusherError);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[POST /api/admin/assign-rep]", error);
    return NextResponse.json({ error: "Failed to assign faculty rep" }, { status: 500 });
  }
}
