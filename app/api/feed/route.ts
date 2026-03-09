import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const departmentId = user.departmentId;

    if (!departmentId) {
       return NextResponse.json([]);
    }

    // A powerful unified feed query using UNION ALL
    const feedQuery = sql`
      SELECT * FROM (
        -- 1. Books
        SELECT 
          b.id as "itemId", 
          'BOOK' as "type", 
          b.title, 
          b.description as "content", 
          b.created_at as "createdAt", 
          u.id as "authorId", 
          u.full_name as "authorName", 
          u.role as "authorRole",
          b.id as "targetId"
        FROM books b
        JOIN users u ON b.user_id = u.id
        WHERE b.department_id = ${departmentId}

        UNION ALL

        -- 2. Threads (Discussions)
        SELECT 
          t.id as "itemId", 
          'THREAD' as "type", 
          t.title, 
          t.content, 
          t.created_at as "createdAt", 
          u.id as "authorId", 
          u.full_name as "authorName", 
          u.role as "authorRole",
          t.course_id as "targetId"
        FROM threads t
        JOIN users u ON t.author_id = u.id
        JOIN courses c ON t.course_id = c.id
        WHERE c.department_id = ${departmentId}

        UNION ALL

        -- 3. Survival Guides
        SELECT 
          g.id as "itemId", 
          'GUIDE' as "type", 
          g.title, 
          substring(g.content from 1 for 250) as "content", 
          g.created_at as "createdAt", 
          u.id as "authorId", 
          u.full_name as "authorName", 
          u.role as "authorRole",
          g.course_id as "targetId"
        FROM survival_guides g
        JOIN users u ON g.author_id = u.id
        JOIN courses c ON g.course_id = c.id
        WHERE c.department_id = ${departmentId}
      ) AS unified_feed
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const feedItems = await db.execute(feedQuery);

    return NextResponse.json({
      items: feedItems.rows,
      hasMore: feedItems.rows.length === limit,
    });
  } catch (error) {
    console.error("[GET /api/feed]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
