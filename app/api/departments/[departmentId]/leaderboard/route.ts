import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { 
  users, 
  books, 
  threads, 
  comments, 
  sessions, 
  survivalGuides, 
  activities 
} from "@/database/schema";
import { eq, count, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { departmentId } = await params;

    // Calculate points for students in the department
    const leaderboard = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        level: users.year,
        // Calculate points via subqueries
        points: sql<number>`
          COALESCE((SELECT COUNT(*) FROM ${books} WHERE ${books.postedBy} = ${users.id}) * 50, 0) +
          COALESCE((SELECT COUNT(*) FROM ${threads} WHERE ${threads.authorId} = ${users.id}) * 15, 0) +
          COALESCE((SELECT COUNT(*) FROM ${comments} WHERE ${comments.authorId} = ${users.id}) * 10, 0) +
          COALESCE((SELECT COUNT(*) FROM ${sessions} WHERE ${sessions.userId} = ${users.id}) * 20, 0) +
          COALESCE((SELECT COUNT(*) FROM ${survivalGuides} WHERE ${survivalGuides.authorId} = ${users.id}) * 50, 0) +
          COALESCE((SELECT COUNT(*) FROM ${activities} WHERE ${activities.userId} = ${users.id} AND ${activities.type} = 'READ') * 10, 0) +
          COALESCE((SELECT COUNT(*) FROM ${activities} WHERE ${activities.userId} = ${users.id} AND ${activities.type} = 'LOGIN') * 5, 0) +
          COALESCE((SELECT COUNT(*) FROM ${activities} WHERE ${activities.userId} = ${users.id} AND ${activities.type} = 'ONBOARDING') * 50, 0)
        `.mapWith(Number)
      })
      .from(users)
      .where(eq(users.departmentId, departmentId))
      .orderBy(sql`points DESC`)
      .limit(50); // Top 50

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("[GET /api/departments/[departmentId]/leaderboard]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
