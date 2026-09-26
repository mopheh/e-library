import { db } from "@/database/drizzle";
import { complaints } from "@/database/schema";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

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

    await notify({
        userId: facultyRepId,
        type: "COMPLAINT",
        category: "messages",
        message: `New message from ${studentUser.fullName}`,
        url: "/profile",
    });

    return NextResponse.json({ success: true, complaint: newComplaint });

  } catch (error) {
    Sentry.captureException(error);
    console.error("Error submitting complaint:", error);
    return NextResponse.json(
      { error: "Failed to submit message" },
      { status: 500 }
    );
  }
}
