// app/api/internal/parse-book/route.ts
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { eq } from "drizzle-orm";
import { bookPages, books } from "@/database/schema";
import { db } from "@/database/drizzle";

export const runtime = "nodejs";

const BATCH_SIZE = 150; // tune for your DB

export async function POST(req: NextRequest) {
  try {
    // Simple auth
    const token = req.headers.get("X-Parse-Token");
    if (!token || token !== process.env.INTERNAL_TASK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookId, fileUrl } = await req.json();
    if (!bookId || !fileUrl) {
      return NextResponse.json(
        { error: "Missing bookId or fileUrl" },
        { status: 400 }
      );
    }

    // Transition to 'processing'
    await db
      .update(books)
      .set({ parseStatus: "processing" as any })
      .where(eq(books.id, bookId));

    // Download the PDF into memory
    const res = await fetch(fileUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to download PDF: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse with pdf-parse
    const parsed = await pdfParse(buffer);
    const rawPages = parsed.text.split(/\f/g); // \f = page break

    // Prepare rows
    const rows = rawPages
      .map((txt, i) => ({
        bookId,
        pageNumber: i + 1,
        textContent: (txt || "").trim(),
      }))
      .filter((r) => r.textContent.length > 0);

    // Batch insert to avoid oversized SQL payloads
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      //@ts-ignore
      await db.insert(bookPages).values(batch);
    }

    // Mark complete with page count
    await db
      .update(books)
      .set({ parseStatus: "completed" as any, pageCount: rows.length })
      .where(eq(books.id, bookId));

    return NextResponse.json({ ok: true, pages: rows.length });
  } catch (err: any) {
    console.error("[POST /api/internal/parse-book] error:", err);

    // Mark failed
    try {
      const { bookId } = await req.json().catch(() => ({}));
      if (bookId) {
        await db
          .update(books)
          .set({ parseStatus: "failed" as any })
          .where(eq(books.id, bookId));
      }
    } catch {}

    return NextResponse.json(
      { error: err?.message || "Parse failed" },
      { status: 500 }
    );
  }
}
