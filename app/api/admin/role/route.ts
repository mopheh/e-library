import { db } from "@/database/drizzle";
import { users, auditLogs, notifications } from "@/database/schema";
import { requireRole } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const ASSIGNABLE_ROLES = ["STUDENT", "ADMIN", "FACULTY REP", "ASPIRANT"] as const;

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ASSIGNABLE_ROLES),
});

export async function PATCH(req: Request) {
  try {
    const authCheck = await requireRole(["ADMIN"]);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }
    const admin = authCheck.user!;

    const result = updateRoleSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 }
      );
    }
    const { userId, role: newRole } = result.data;

    // Prevent self-demotion
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.role === newRole) {
      return NextResponse.json(
        { error: `User is already ${newRole}` },
        { status: 400 }
      );
    }

    const previousRole = targetUser.role;

    // Update role in Neon DB
    const [updatedUser] = await db
      .update(users)
      .set({ role: newRole })
      .where(eq(users.id, userId))
      .returning();

    // Update Clerk publicMetadata
    const client = await clerkClient();
    await client.users.updateUserMetadata(updatedUser.clerkId, {
      publicMetadata: { role: newRole },
    });

    // Audit log
    await db.insert(auditLogs).values({
      actionType: "ROLE_CHANGE",
      targetId: updatedUser.id,
      performedBy: admin.id,
      details: {
        email: updatedUser.email,
        previousRole,
        newRole,
      },
    });

    // Notify the user
    const roleLabel =
      newRole === "FACULTY REP"
        ? "Faculty Representative"
        : newRole.charAt(0) + newRole.slice(1).toLowerCase();

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: updatedUser.id,
        type: "SYSTEM",
        message: `Your role has been updated to ${roleLabel} by an administrator.`,
      })
      .returning();

    try {
      await pusherServer.trigger(
        `user-${updatedUser.id}`,
        "new-notification",
        notification
      );
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        previousRole,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/admin/role]", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
