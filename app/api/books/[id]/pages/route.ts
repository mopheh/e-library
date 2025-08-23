import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { bookPages } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const pages = await db
      .select()
      .from(bookPages)
      .where(eq(bookPages.bookId, id))
      .orderBy(bookPages.pageNumber);

    return NextResponse.json({ pages });
  } catch (err: any) {
    console.error("[GET /books/:bookId/pages]", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch pages" },
      { status: 500 }
    );
  }
}
