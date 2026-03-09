import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { studyRooms, studyRoomMembers, users } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId } = await params;

    const roomData = await db
      .select({
        id: studyRooms.id,
        name: studyRooms.name,
        description: studyRooms.description,
        courseId: studyRooms.courseId,
        createdAt: studyRooms.createdAt,
        hostId: studyRooms.hostId,
      })
      .from(studyRooms)
      .where(eq(studyRooms.id, roomId))
      .limit(1);

    if (!roomData.length) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const members = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        joinedAt: studyRoomMembers.joinedAt,
      })
      .from(studyRoomMembers)
      .innerJoin(users, eq(studyRoomMembers.userId, users.id))
      .where(eq(studyRoomMembers.roomId, roomId));

    return NextResponse.json({
      room: roomData[0],
      members,
      isMember: members.some(m => m.id === user.id)
    });
  } catch (error) {
    console.error("[GET /api/study-rooms/[roomId]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> } // Join room
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { roomId } = await params;

    // Check if already member
    const existing = await db
      .select()
      .from(studyRoomMembers)
      .where(and(eq(studyRoomMembers.roomId, roomId), eq(studyRoomMembers.userId, user.id)));

    if (existing.length === 0) {
      await db.insert(studyRoomMembers).values({
        roomId,
        userId: user.id
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/study-rooms/[roomId]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
