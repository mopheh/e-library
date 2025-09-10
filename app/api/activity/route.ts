import { db } from "@/database/drizzle";
import { activities, books, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
  const feed = await db
    .select({
      id: activities.id,
      type: activities.type,
      meta: activities.meta,
      createdAt: activities.createdAt,
      book: {
        id: books.id,
        title: books.title,
      },
    })
    .from(activities)
    .leftJoin(books, eq(activities.targetId, books.id))
    .where(eq(activities.userId, user.id))
    .orderBy(desc(activities.createdAt))
    .limit(20);

  return Response.json(feed);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth(); // logged in user
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    const body = await req.json();

    await db.insert(activities).values({
      userId: user.id,
      type: body.type,
      targetId: body.targetId ?? null,
      meta: body.meta ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}
