import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { seniorQa, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const seniorQaSchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  content: z.string().min(1, "content is required"),
  targetLevel: z
    .enum(["100", "200", "300", "400", "500", "600", "ALL"])
    .optional()
    .default("ALL"),
  isAnonymous: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetLevel = searchParams.get("targetLevel") || "ALL";

    const rawData = await db
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
      .leftJoin(users, eq(seniorQa.authorId, users.id))
      .where(eq(seniorQa.departmentId, user.departmentId!))
      .orderBy(desc(seniorQa.createdAt));

    const data = rawData
      .filter(
        (q) =>
          targetLevel === "ALL" ||
          q.targetLevel === targetLevel ||
          q.targetLevel === "ALL",
      )
      .map((q) =>
        q.isAnonymous
          ? { ...q, authorName: "Anonymous Student", authorRole: "STUDENT", authorLevel: "---" }
          : q,
      );

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

    const result = seniorQaSchema.safeParse(await req.json());
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.errors },
        { status: 400 },
      );
    }
    const { title, content, targetLevel, isAnonymous } = result.data;

    if (!user.departmentId) {
      return NextResponse.json({ error: "User has no department" }, { status: 400 });
    }

    const [newQuestion] = await db
      .insert(seniorQa)
      .values({
        title,
        content,
        targetLevel,
        isAnonymous,
        departmentId: user.departmentId,
        authorId: user.id,
      })
      .returning();

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("[POST /api/senior-qa]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
