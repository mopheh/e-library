import { db } from "@/database/drizzle";
import { goals, users, readingSessions, userBooks } from "@/database/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, and, gt, sql } from "drizzle-orm";
import { z } from "zod";

const goalSchema = z.object({
  type: z.enum(["minutes_read", "books_read"], {
    errorMap: () => ({ message: "type must be 'minutes_read' or 'books_read'" }),
  }),
  target: z.number().int().positive("target must be a positive integer"),
  frequency: z.enum(["daily", "weekly", "monthly"]).optional().default("weekly"),
});

async function resolveUser(clerkId: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return user ?? null;
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await resolveUser(clerkId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userGoals = await db.select().from(goals).where(eq(goals.userId, user.id));

    // Resolve progress for each goal in parallel — no sequential awaits
    const goalsWithProgress = await Promise.all(
      userGoals.map(async (goal) => {
        let currentProgress = 0;

        if (goal.type === "minutes_read") {
          const [result] = await db
            .select({ sum: sql<number>`coalesce(sum(${readingSessions.duration}), 0)` })
            .from(readingSessions)
            .where(eq(readingSessions.userId, user.id));
          currentProgress = Number(result?.sum ?? 0);
        } else if (goal.type === "books_read") {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(userBooks)
            .where(and(eq(userBooks.userId, user.id), gt(userBooks.readCount, 0)));
          currentProgress = Number(result?.count ?? 0);
        }

        return { ...goal, currentProgress };
      }),
    );

    return NextResponse.json(goalsWithProgress);
  } catch (error) {
    console.error("[GET /api/goals]", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await resolveUser(clerkId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const result = goalSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { type, target, frequency } = result.data;

    // Upsert: update if same type+frequency exists, otherwise create
    const [existing] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(
        and(eq(goals.userId, user.id), eq(goals.type, type), eq(goals.frequency, frequency)),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(goals)
        .set({ target, updatedAt: new Date() })
        .where(eq(goals.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [newGoal] = await db
      .insert(goals)
      .values({ userId: user.id, type, target, frequency })
      .returning();
    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error("[POST /api/goals]", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
