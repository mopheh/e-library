"use server";

import { db } from "@/database/drizzle";
import { users, chatRooms, chatMessages, notifications } from "@/database/schema";
import { eq, or, and, desc, asc, sql } from "drizzle-orm";
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
            with: {
                // We'll need to define relations in schema for better fetching, 
                // but for now, we'll manually fetch the participant info.
            },
            orderBy: [desc(chatRooms.createdAt)]
        });

        const roomsWithParticipants = await Promise.all(rooms.map(async (room) => {
            const otherUserId = room.userOneId === currentUser.id ? room.userTwoId : room.userOneId;
            const otherUser = await db.query.users.findFirst({
                where: eq(users.id, otherUserId)
            });

            // Get last message
            const lastMessage = await db.query.chatMessages.findFirst({
                where: eq(chatMessages.roomId, room.id),
                orderBy: [desc(chatMessages.createdAt)]
            });

            // Get other user image from Clerk
            let imageUrl = null;
            if (otherUser) {
                try {
                    const client = await clerkClient();
                    const clerkUser = await client.users.getUser(otherUser.clerkId);
                    imageUrl = clerkUser.imageUrl;
                } catch (e) {
                    console.error("Failed to fetch clerk image for room participant", e);
                }
            }

            return {
                id: room.id,
                otherUser: {
                    id: otherUser?.id,
                    fullName: otherUser?.fullName,
                    imageUrl,
                },
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    senderId: lastMessage.senderId,
                } : null
            };
        }));

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

        const messages = await db.query.chatMessages.findMany({
            where: eq(chatMessages.roomId, roomId),
            orderBy: [asc(chatMessages.createdAt)]
        });

        return { success: true, data: messages };
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

        // Trigger real-time event
        console.log(`Triggering Pusher event on channel private-chat-room-${roomId}`);
        await pusherServer.trigger(`private-chat-room-${roomId}`, "new-message", newMessage);

        // Notify recipient
        const recipientId = room.userOneId === currentUser.id ? room.userTwoId : room.userOneId;
        const [notif] = await db.insert(notifications).values({
            userId: recipientId,
            type: "MESSAGE",
            message: `New message from ${currentUser.fullName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            targetId: roomId,
        }).returning();

        await pusherServer.trigger(`user-${recipientId}`, "new-notification", notif);

        return { success: true, data: newMessage };
        
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Message failed to send" };
    }
}
