import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { studyRooms, studyRoomMembers, users } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;

    const rooms = await db
      .select({
        id: studyRooms.id,
        name: studyRooms.name,
        description: studyRooms.description,
        createdAt: studyRooms.createdAt,
        host: {
          id: users.id,
          fullName: users.fullName,
        }
      })
      .from(studyRooms)
      .leftJoin(users, eq(studyRooms.hostId, users.id))
      .where(eq(studyRooms.courseId, courseId))
      .orderBy(desc(studyRooms.createdAt));

    // For each room, append member count and if current user is member
    const enrichedRooms = await Promise.all(rooms.map(async (room) => {
      const members = await db
        .select()
        .from(studyRoomMembers)
        .where(eq(studyRoomMembers.roomId, room.id));
      
      return {
        ...room,
        memberCount: members.length,
        isMember: members.some(m => m.userId === user.id)
      };
    }));

    return NextResponse.json(enrichedRooms);
  } catch (error) {
    console.error("[GET /api/courses/[courseId]/study-rooms]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await params;
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Room name required" }, { status: 400 });
    }

    const [newRoom] = await db.insert(studyRooms).values({
      courseId,
      hostId: user.id,
      name,
      description,
    }).returning();

    // Host automatically joins the room
    await db.insert(studyRoomMembers).values({
      roomId: newRoom.id,
      userId: user.id
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("[POST /api/courses/[courseId]/study-rooms]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
