import { db } from "@/database/drizzle";
import { goals, users, readingSessions, userBooks } from "@/database/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, and, gt, sql } from "drizzle-orm";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, user.id));

    const goalsWithProgress = await Promise.all(
        userGoals.map(async (goal) => {
            let currentProgress = 0;

            if (goal.type === "minutes_read") {
                const result = await db
                    .select({ sum: sql<number>`sum(${readingSessions.duration})` })
                    .from(readingSessions)
                    .where(eq(readingSessions.userId, user.id));
                currentProgress = result[0].sum || 0;
            } else if (goal.type === "books_read") {
                const result = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(userBooks)
                    .where(
                        and(
                            eq(userBooks.userId, user.id),
                            gt(userBooks.readCount, 0)
                        )
                    );
                currentProgress = result[0].count || 0;
            }

            return { ...goal, currentProgress };
        })
    );

    return NextResponse.json(goalsWithProgress);
  } catch (error: any) {
    console.error("Goals fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { type, target, frequency } = body;

    if (!type || !target) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if goal of this type exists to update, or just create new used for now?
    // Let's assume we update if exists matching type and frequency
    const existing = await db.select().from(goals).where(and(
        eq(goals.userId, user.id),
        eq(goals.type, type),
        eq(goals.frequency, frequency || 'weekly')
    ));

    if (existing.length > 0) {
        // update
        const updated = await db.update(goals)
            .set({ target, updatedAt: new Date() })
            .where(eq(goals.id, existing[0].id))
            .returning();
        return NextResponse.json(updated[0]);
    } else {
        // create
        const newGoal = await db.insert(goals).values({
            userId: user.id,
            type,
            target,
            frequency: frequency || 'weekly'
        }).returning();
        return NextResponse.json(newGoal[0]);
    }

  } catch (error: any) {
    console.error("Goals create error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
