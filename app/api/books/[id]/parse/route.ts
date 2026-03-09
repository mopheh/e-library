import { parsePdfPages } from "@/actions/parseBook";
import { db } from "@/database/drizzle";
import { bookPages, books } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import fetch from "node-fetch";
import fs from "fs";
import os from "os";
import path from "path";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookId } = await params;

  const [book] = await db.select().from(books).where(eq(books.id, bookId));

  if (!book?.fileUrl) {
    return NextResponse.json({ error: "No PDF found" }, { status: 400 });
  }

  const tmpPath = path.join(os.tmpdir(), `api_parse_${bookId}_${Date.now()}.pdf`);

  try {
    const res = await fetch(book.fileUrl);
    if (!res.ok) throw new Error("Failed to fetch PDF");
    if (!res.body) throw new Error("Null response body");

    const fileStream = fs.createWriteStream(tmpPath);
    await new Promise<void>((resolve, reject) => {
      res.body!.pipe(fileStream);
      res.body!.on("error", reject);
      fileStream.on("finish", () => resolve());
    });

    const numPages = await parsePdfPages(tmpPath, bookId);

    await db
      .update(books)
      .set({
        parseStatus: "completed",
        pageCount: numPages,
      })
      .where(eq(books.id, bookId));

    return NextResponse.json({ success: true });
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }
}
