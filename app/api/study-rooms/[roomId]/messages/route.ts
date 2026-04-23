import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import Pusher from "pusher";
import { z } from "zod";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const messageSchema = z.object({
  text: z.string().min(1, "Message text is required").max(1000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId } = await params;

    const result = messageSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { text } = result.data;

    const messageData = {
      id: crypto.randomUUID(),
      text,
      userId: user.id,
      userName: user.fullName || "Student",
      createdAt: new Date().toISOString(),
    };

    await pusher.trigger(`presence-room-${roomId}`, "new-message", messageData);

    return NextResponse.json(messageData, { status: 201 });
  } catch (error) {
    console.error("[POST /api/study-rooms/[roomId]/messages]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
