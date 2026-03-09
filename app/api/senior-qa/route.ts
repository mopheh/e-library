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

    let query = db
      .select({
        id: seniorQa.id,
        targetLevel: seniorQa.targetLevel,
        title: seniorQa.title,
        content: seniorQa.content,
        isAnonymous: seniorQa.isAnonymous,
        createdAt: seniorQa.createdAt,
        authorName: users.fullName,
        authorRole: users.role,
        authorLevel: users.year,
      })
      .from(seniorQa)
      .leftJoin(users, eq(seniorQa.authorId, users.id));

    // Filter by department
    if (user.departmentId) {
       query.where(eq(seniorQa.departmentId, user.departmentId));
    }
    
    const rawData = await query.orderBy(desc(seniorQa.createdAt));

    // Filter by target level if specified
    const data = targetLevel !== "ALL" ? rawData.filter(q => q.targetLevel === targetLevel || q.targetLevel === "ALL") : rawData;

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
