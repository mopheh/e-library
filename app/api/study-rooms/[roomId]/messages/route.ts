import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import Pusher from "pusher";

// Initialize Pusher server instance
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId } = await params;
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Message text required" }, { status: 400 });
    }

    const messageData = {
      id: crypto.randomUUID(),
      text,
      userId: user.id,
      userName: user.fullName || "Student",
      createdAt: new Date().toISOString(),
    };

    // Trigger Pusher event
    await pusher.trigger(`presence-room-${roomId}`, "new-message", messageData);

    return NextResponse.json(messageData, { status: 201 });
  } catch (error) {
    console.error("[POST /api/study-rooms/[roomId]/messages]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
