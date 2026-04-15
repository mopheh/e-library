import { pusherServer } from "@/lib/pusher";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/database/drizzle";
import { users, chatRooms } from "@/database/schema";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const currentUser = await db.query.users.findFirst({
        where: eq(users.clerkId, clerkId)
    });
    if (!currentUser) return new NextResponse("User not found", { status: 404 });

    const body = await req.formData();
    const socketId = body.get("socket_id") as string;
    const channel = body.get("channel_name") as string;

    // Expected channel format: private-chat-room-[roomId]
    const roomId = channel.replace("private-chat-room-", "");

    // Verify user is part of this chat room
    const room = await db.query.chatRooms.findFirst({
        where: and(
            eq(chatRooms.id, roomId),
            or(
                eq(chatRooms.userOneId, currentUser.id),
                eq(chatRooms.userTwoId, currentUser.id)
            )
        )
    });

    if (!room) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel);
    return NextResponse.json(authResponse);

  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
