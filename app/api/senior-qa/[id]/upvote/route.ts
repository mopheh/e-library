import { db } from "@/database/drizzle";
import { seniorQa } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Fetch current question to increment upvotes
    const question = await db.query.seniorQa.findFirst({
      where: eq(seniorQa.id, id),
    });

    if (!question) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await db.update(seniorQa)
      .set({ upvotes: question.upvotes + 1 })
      .where(eq(seniorQa.id, id));

    return NextResponse.json({ success: true, newUpvotes: question.upvotes + 1 });
  } catch (error) {
    console.error("[SENIOR_QA_UPVOTE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
