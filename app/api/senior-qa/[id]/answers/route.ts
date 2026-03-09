import { db } from "@/database/drizzle";
import { seniorQaAnswers, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const answers = await db
      .select({
        id: seniorQaAnswers.id,
        content: seniorQaAnswers.content,
        upvotes: seniorQaAnswers.upvotes,
        isAccepted: seniorQaAnswers.isAccepted,
        createdAt: seniorQaAnswers.createdAt,
        authorName: users.fullName,
        authorLevel: users.year,
        authorRole: users.role,
      })
      .from(seniorQaAnswers)
      .innerJoin(users, eq(seniorQaAnswers.authorId, users.id))
      .where(eq(seniorQaAnswers.questionId, (await params).id))
      .orderBy(seniorQaAnswers.createdAt);

    return NextResponse.json(answers);
  } catch (error) {
    console.error("[SENIOR_QA_ANSWERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return new NextResponse("Missing content", { status: 400 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, user.id),
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const answer = await db.insert(seniorQaAnswers).values({
      questionId: (await params).id,
      authorId: dbUser.id,
      content,
    }).returning();

    return NextResponse.json(answer[0]);
  } catch (error) {
    console.error("[SENIOR_QA_ANSWERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
