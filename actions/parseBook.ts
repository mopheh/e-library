import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { db } from "@/database/drizzle";
import { bookPages } from "@/database/schema";
import { extractTextWithOCR } from "@/lib/ocr";
import { getEmbedding } from "@/lib/embeddings";
import { sql } from "drizzle-orm";

import * as path from "path";
import * as mammoth from "mammoth";

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
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
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
        
        // pgvector requires exactly 768 dimensions. If it's different, we save null to avoid a crash.
        const isValidEmbedding = embedding.length === 768;
        
        if (embedding.length > 0 && !isValidEmbedding) {
          console.warn(`⚠️ Page ${page.pageNumber}: Embedding dimension mismatch (${embedding.length} vs 768). Saving text only.`);
        }

        return {
          ...page,
          embedding: isValidEmbedding ? embedding : null,
        };
      })
    );

    try {
      await db
        .insert(bookPages)
        .values(batchWithEmbeddings)
        .onConflictDoUpdate({
          target: [bookPages.bookId, bookPages.pageNumber],
          set: {
            textChunk: sql`excluded.text_chunk`,
            embedding: sql`excluded.embedding`,
          },
        });
    } catch (dbErr: any) {
      console.error(`❌ DB Insert failed for batch starting at page ${batch[0].pageNumber}:`, dbErr.message.substring(0, 300));
      throw dbErr;
    }
  }

  return numPages;
}

export async function parseDocxPages(filePath: string, bookId: string) {
  const result = await mammoth.extractRawText({ path: filePath });
  const fullText = result.value;

  if (!fullText || fullText.trim().length === 0) {
    throw new Error("DOCX produced zero text");
  }

  // Split into virtual pages of roughly 2500 characters
  // Try to split on paragraphs to avoid breaking words
  const PAGE_SIZE = 2500;
  const paragraphs = fullText.split(/\n+/);
  
  const pages: {
    bookId: string;
    pageNumber: number;
    textChunk: string;
  }[] = [];

  let currentPage = "";
  let pageNumber = 1;

  for (const p of paragraphs) {
    if ((currentPage.length + p.length) > PAGE_SIZE && currentPage.length > 0) {
      pages.push({ bookId, pageNumber, textChunk: currentPage.trim() });
      pageNumber++;
      currentPage = p + "\n\n";
    } else {
      currentPage += p + "\n\n";
    }
  }
  
  if (currentPage.trim().length > 0) {
    pages.push({ bookId, pageNumber, textChunk: currentPage.trim() });
  }

  const BATCH_SIZE = 10;
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);

    const batchWithEmbeddings = await Promise.all(
      batch.map(async (page) => {
        const embedding = await getEmbedding(page.textChunk);
        const isValidEmbedding = embedding.length === 768;
        
        if (embedding.length > 0 && !isValidEmbedding) {
          console.warn(`⚠️ Page ${page.pageNumber}: Embedding dimension mismatch (${embedding.length} vs 768). Saving text only.`);
        }

        return {
          ...page,
          embedding: isValidEmbedding ? embedding : null,
        };
      })
    );

    try {
      await db
        .insert(bookPages)
        .values(batchWithEmbeddings)
        .onConflictDoUpdate({
          target: [bookPages.bookId, bookPages.pageNumber],
          set: {
            textChunk: sql`excluded.text_chunk`,
            embedding: sql`excluded.embedding`,
          },
        });
    } catch (dbErr: any) {
      console.error(`❌ DB Insert failed for batch starting at page ${batch[0].pageNumber}:`, dbErr.message.substring(0, 300));
      throw dbErr;
    }
  }

  return pages.length;
}
