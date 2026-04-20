import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { candidateProfiles, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select().from(users).where(eq(users.clerkId, userId));
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, user.id));

    return NextResponse.json({ success: true, profile: profile || null });
  } catch (error) {
    console.error("Fetch Aspirant Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
