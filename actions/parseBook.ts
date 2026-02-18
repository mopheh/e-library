import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { db } from "@/database/drizzle";
import { bookPages } from "@/database/schema";
import { extractTextWithOCR } from "@/lib/ocr";

export async function parsePdfPages(fileBuffer: Buffer, bookId: string) {
  const uint8Array = new Uint8Array(fileBuffer);

  const pdf = await pdfjsLib.getDocument({
    data: uint8Array,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const numPages = pdf.numPages;

  const pages: {
    bookId: string;
    pageNumber: number;
    textChunk: string;
  }[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    let text = content.items
      .map((item: any) => item.str ?? "")
      .join(" ")
      .trim();

    if (!text) {
      console.log(`📷 Page ${i} has no text. Running OCR...`);
      text = await extractTextWithOCR(pdf, i);
    }

    pages.push({
      bookId,
      pageNumber: i,
      textChunk: text,
    });
  }

  const nonEmpty = pages.filter((p) => p.textChunk.length > 0);

  if (nonEmpty.length === 0) {
    throw new Error("PDF produced zero text even after OCR");
  }

  const BATCH_SIZE = 10;

  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);

    await db.insert(bookPages).values(batch);
  }

  return numPages;
}
