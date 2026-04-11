import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { db } from "@/database/drizzle";
import { bookPages } from "@/database/schema";
import { extractTextWithOCR } from "@/lib/ocr";
import { getEmbedding } from "@/lib/embeddings";

import * as path from "path";

export async function parsePdfPages(filePath: string, bookId: string) {
  const standardFontDataUrl = path.join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts") + "/";

  const pdf = await pdfjsLib.getDocument({
    url: filePath,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    standardFontDataUrl,
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

    const lowerText = text.toLowerCase();
    // A typical scanned page with a watermark might only yield the watermark text.
    const isLikelyScannedImage =
      lowerText.includes("camscanner") ||
      lowerText.includes("scanned with") ||
      (text.length > 0 && text.length < 50);

    if (!text || isLikelyScannedImage) {
      const reason = !text ? "no text" : `suspiciously short or watermark-only (${text.length} chars)`;
      console.log(`📷 Page ${i} has ${reason}. Running OCR...`);
      
      const ocrText = await extractTextWithOCR(pdf, i);
      
      // If OCR extracted more meaningful content than the initial parse, use it
      if (ocrText.trim().length > text.trim().length || !text) {
        text = ocrText;
      }
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

  for (let i = 0; i < nonEmpty.length; i += BATCH_SIZE) {
    const batch = nonEmpty.slice(i, i + BATCH_SIZE);

    const batchWithEmbeddings = await Promise.all(
      batch.map(async (page) => {
        const embedding = await getEmbedding(page.textChunk);
        return {
          ...page,
          // pgvector requires strings in "[0.1, 0.2, ...]" format for the 'vector' type in many drivers
          embedding: embedding.length > 0 ? `[${embedding.join(",")}]` : null 
        };
      })
    );

    await db.insert(bookPages).values(batchWithEmbeddings);
  }

  return numPages;
}
