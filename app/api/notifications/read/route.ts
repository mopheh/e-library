import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, inArray, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds } = await req.json();

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return NextResponse.json({ error: "Invalid notification IDs provided" }, { status: 400 });
    }

    // Mark as read where ID is in the array AND userId matches the current user
    await db
        .update(notifications)
        .set({ isRead: true })
        .where(
            and(
                inArray(notifications.id, notificationIds),
                eq(notifications.userId, user.id)
            )
        );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
