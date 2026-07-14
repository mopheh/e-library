"use server";

import { db } from "@/database/drizzle";
import { users, chatRooms, chatMessages, notifications } from "@/database/schema";
import { eq, or, and, desc, asc, sql, inArray } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

export async function getChatRooms() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId)
        });
        if (!currentUser) throw new Error("User not found");

        const rooms = await db.query.chatRooms.findMany({
            where: or(
                eq(chatRooms.userOneId, currentUser.id),
                eq(chatRooms.userTwoId, currentUser.id)
            ),
            limit: 20, // ADDED LIMIT to prevent excessive DB calls
            orderBy: [desc(chatRooms.createdAt)]
        });

        if (rooms.length === 0) {
            return { success: true, data: [] };
        }

        const otherUserIds = rooms.map((room) =>
            room.userOneId === currentUser.id ? room.userTwoId : room.userOneId
        );
        const roomIds = rooms.map((room) => room.id);

        // Batch-fetch every "other participant" in one query instead of one per room.
        const otherUsers = await db
            .select({ id: users.id, fullName: users.fullName })
            .from(users)
            .where(inArray(users.id, otherUserIds));
        const otherUserById = new Map(otherUsers.map((u) => [u.id, u]));

        // Batch-fetch the latest message per room in one query instead of one per room.
        const lastMessagesResult = await db.execute(sql`
            SELECT DISTINCT ON (room_id)
                room_id    AS "roomId",
                content    AS "content",
                created_at AS "createdAt",
                sender_id  AS "senderId"
            FROM chat_messages
            WHERE room_id IN ${roomIds}
            ORDER BY room_id, created_at DESC
        `);
        const lastMessageByRoom = new Map(
            (lastMessagesResult.rows as any[]).map((m) => [m.roomId as string, m])
        );

        const roomsWithParticipants = rooms.map((room) => {
            const otherUserId = room.userOneId === currentUser.id ? room.userTwoId : room.userOneId;
            const otherUser = otherUserById.get(otherUserId);
            const lastMessage = lastMessageByRoom.get(room.id);

            return {
                id: room.id,
                otherUser: {
                    id: otherUser?.id,
                    fullName: otherUser?.fullName,
                    // Clerk API call removed to prevent massive N+1 HTTP latency.
                    // Avatars should be managed locally or fetched via batch if necessary.
                    imageUrl: null,
                },
                lastMessage: lastMessage ? {
                    content: lastMessage.content as string,
                    createdAt: lastMessage.createdAt as string,
                    senderId: lastMessage.senderId as string,
                } : null
            };
        });

        return { success: true, data: roomsWithParticipants };

    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        return { success: false, error: "Failed to load chats" };
    }
}

export async function getMessages(roomId: string) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId)
        });
        if (!currentUser) throw new Error("User not found");

        // Safety check: is user in room?
        const room = await db.query.chatRooms.findFirst({
            where: and(
                eq(chatRooms.id, roomId),
                or(
                    eq(chatRooms.userOneId, currentUser.id),
                    eq(chatRooms.userTwoId, currentUser.id)
                )
            )
        });
        if (!room) throw new Error("Access denied");

        // Cap history to the most recent 200 messages so a long-lived room
        // doesn't force an ever-growing, unbounded payload on every open.
        const recentMessages = await db.query.chatMessages.findMany({
            where: eq(chatMessages.roomId, roomId),
            orderBy: [desc(chatMessages.createdAt)],
            limit: 200,
        });

        return { success: true, data: recentMessages.reverse() };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, error: "Failed to load message history" };
    }
}

export async function sendMessage(roomId: string, content: string) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");

        const currentUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId)
        });
        if (!currentUser) throw new Error("User not found");

        // Verify membership
        const room = await db.query.chatRooms.findFirst({
            where: and(
                eq(chatRooms.id, roomId),
                or(
                    eq(chatRooms.userOneId, currentUser.id),
                    eq(chatRooms.userTwoId, currentUser.id)
                )
            )
        });
        if (!room) throw new Error("Forbidden");

        const [newMessage] = await db.insert(chatMessages).values({
            roomId,
            senderId: currentUser.id,
            content,
        }).returning();

        // Trigger real-time event. Fire-and-forget: a Pusher hiccup shouldn't
        // make an already-saved message report back to the user as "failed".
        pusherServer
            .trigger(`private-chat-room-${roomId}`, "new-message", newMessage)
            .catch((err) => console.error("Pusher trigger failed (new-message):", err));

        // Notify recipient
        const recipientId = room.userOneId === currentUser.id ? room.userTwoId : room.userOneId;
        const [notif] = await db.insert(notifications).values({
            userId: recipientId,
            type: "MESSAGE",
            message: `New message from ${currentUser.fullName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            targetId: roomId,
        }).returning();

        pusherServer
            .trigger(`user-${recipientId}`, "new-notification", notif)
            .catch((err) => console.error("Pusher trigger failed (new-notification):", err));

        return { success: true, data: newMessage };
        
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Message failed to send" };
    }
}
