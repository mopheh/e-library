import { db } from "@/database/drizzle";
import { complaints, notifications } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const studentUser = await getCurrentUser();

    if (!studentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { facultyRepId, message } = await req.json();

    if (!facultyRepId || !message || message.trim() === "") {
        return NextResponse.json({ error: "Message and representative ID are required" }, { status: 400 });
    }

    const [newComplaint] = await db.insert(complaints).values({
        studentId: studentUser.id,
        facultyRepId: facultyRepId,
        message: message.trim(),
        status: "PENDING"
    }).returning();

    // 1. Save Notification
    const [newNotification] = await db.insert(notifications).values({
        userId: facultyRepId,
        type: "COMPLAINT",
        message: `New message from ${studentUser.fullName}`,
    }).returning();

    // 2. Trigger Real-time Event
    try {
        await pusherServer.trigger(
            `user-${facultyRepId}`,
            "new-notification",
            newNotification
        );
    } catch (pusherError) {
        console.error("Failed to trigger Pusher event:", pusherError);
    }

    return NextResponse.json({ success: true, complaint: newComplaint });

  } catch (error) {
    console.error("Error submitting complaint:", error);
    return NextResponse.json(
      { error: "Failed to submit message" },
      { status: 500 }
    );
  }
}
