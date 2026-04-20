import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { seniorQa, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetLevel = searchParams.get("targetLevel") || "ALL";

    // Departmental isolation: Only show questions from the user's department
    let query = db
      .select({
        id: seniorQa.id,
        targetLevel: seniorQa.targetLevel,
        title: seniorQa.title,
        content: seniorQa.content,
        isAnonymous: seniorQa.isAnonymous,
        createdAt: seniorQa.createdAt,
        upvotes: seniorQa.upvotes,
        authorName: users.fullName,
        authorRole: users.role,
        authorLevel: users.year,
      })
      .from(seniorQa)
      .leftJoin(users, eq(seniorQa.authorId, users.id));

    if (user.departmentId) {
      query.where(eq(seniorQa.departmentId, user.departmentId));
    }
    
    const rawData = await query.orderBy(desc(seniorQa.createdAt));

    // Refine and Redact sensitive info
    const data = rawData
      .filter(q => targetLevel === "ALL" || q.targetLevel === targetLevel || q.targetLevel === "ALL")
      .map(q => {
        if (q.isAnonymous) {
          return {
            ...q,
            authorName: "Anonymous Student",
            authorRole: "Student",
            authorLevel: "---",
          };
        }
        return q;
      });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/senior-qa]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, content, targetLevel, isAnonymous } = body;

    const [newQuestion] = await db.insert(seniorQa).values({
      title,
      content,
      targetLevel: targetLevel || "ALL",
      isAnonymous: isAnonymous || false,
      departmentId: user.departmentId!,
      authorId: user.id,
    }).returning();

    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error("[POST /api/senior-qa]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
