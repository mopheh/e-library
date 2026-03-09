import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { departmentCommunities, communityPosts, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    if (!departmentId) {
      return NextResponse.json({ error: "Missing departmentId" }, { status: 400 });
    }

    const [community] = await db
      .select()
      .from(departmentCommunities)
      .where(eq(departmentCommunities.departmentId, departmentId))
      .limit(1);

    if (!community) {
      return NextResponse.json({ success: true, posts: [] });
    }

    const posts = await db
      .select({
        id: communityPosts.id,
        content: communityPosts.content,
        isPinned: communityPosts.isPinned,
        createdAt: communityPosts.createdAt,
        authorName: users.fullName,
        authorRole: users.role,
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.authorId, users.id))
      .where(eq(communityPosts.communityId, community.id))
      .orderBy(desc(communityPosts.createdAt))
      .limit(20);

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Fetch Community Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
