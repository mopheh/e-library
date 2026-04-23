import { db } from "@/database/drizzle";
import { activities, books, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const activitySchema = z.object({
  type: z.string().min(1, "type is required"),
  targetId: z.string().uuid().optional().nullable(),
  meta: z.record(z.unknown()).optional().nullable(),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

  return NextResponse.json(feed);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Zod validation
    const result = activitySchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { type, targetId, meta } = result.data;

    await db.insert(activities).values({
      userId: user.id,
      type,
      targetId: targetId ?? null,
      meta: meta ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/activity]", err);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
