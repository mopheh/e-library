import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { db } from "@/database/drizzle";
import { bookPages } from "@/database/schema";
import { extractTextWithOCR } from "@/lib/ocr";
import { getEmbedding } from "@/lib/embeddings";
import { sql } from "drizzle-orm";

import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import * as mammoth from "mammoth";

const execFileAsync = promisify(execFile);

const PAGE_BREAK_RE = /<!--\s*PAGE_BREAK\s*-->/g;

// Postgres text columns reject a raw NUL byte, and pdf2md's font-glyph
// decoding can emit one (or other stray control characters) when a PDF's
// embedded font maps a glyph to an undecodable code point - observed in
// practice on real library PDFs with footnote/bullet glyphs. Built from
// character codes rather than escape-sequence literals to avoid any risk
// of those literals being written out as the raw bytes they represent.
const KEEP_CONTROL_CODES = new Set([9, 10, 13]); // tab, newline, carriage return
const DISALLOWED_CONTROL_CODES: number[] = [];
for (let c = 0; c < 32; c++) {
  if (!KEEP_CONTROL_CODES.has(c)) DISALLOWED_CONTROL_CODES.push(c);
}
const DISALLOWED_CONTROL_REGEX = new RegExp(
  "[" + DISALLOWED_CONTROL_CODES.map((c) => String.fromCharCode(c)).join("") + "]",
  "g",
);

function sanitizeExtractedText(text: string): string {
  return text.replace(DISALLOWED_CONTROL_REGEX, "");
}

/**
 * Converts a PDF to Markdown using @opendocsg/pdf2md, run in a throwaway
 * child process (see lib/pdf2md-worker.cjs for why). Returns null on any
 * failure so callers can fall back to the legacy raw-text extraction -
 * this must never be the reason a book fails to parse.
 */
async function convertPdfToMarkdownIsolated(pdfPath: string): Promise<string | null> {
  const outputPath = path.join(os.tmpdir(), `pdf2md_${Date.now()}_${Math.random().toString(36).slice(2)}.md`);
  try {
    await execFileAsync(
      process.execPath,
      [path.join(process.cwd(), "lib", "pdf2md-worker.cjs"), pdfPath, outputPath],
      { timeout: 8 * 60 * 1000, maxBuffer: 1024 * 1024 * 50 },
    );
    return fs.readFileSync(outputPath, "utf-8");
  } catch (err: any) {
    console.warn(`⚠️ pdf2md conversion failed, falling back to legacy text extraction: ${err.message}`);
    return null;
  } finally {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

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

  // Try the Markdown-aware extraction first (preserves headings/lists/
  // footnotes and strips repeated running headers/footers, which meaningfully
  // improves RAG chunk quality). `<!-- PAGE_BREAK -->` markers let us keep the
  // exact same per-page structure the rest of the pipeline (OCR fallback,
  // annotations, AI citations by page number) depends on. If pdf2md fails, or
  // its page-break count doesn't match the PDF's actual page count, we fall
  // back to the original raw pdfjs-dist text join for every page rather than
  // risk misaligned page numbers.
  let mdPages: string[] | null = null;
  const markdown = await convertPdfToMarkdownIsolated(filePath);
  if (markdown) {
    const candidate = sanitizeExtractedText(markdown)
      .split(PAGE_BREAK_RE)
      .map((s) => s.trim());
    if (candidate.length === numPages) {
      mdPages = candidate;
    } else {
      console.warn(
        `⚠️ pdf2md page count (${candidate.length}) doesn't match PDF page count (${numPages}) for book ${bookId}. Falling back to legacy text extraction.`,
      );
    }
  }

  const pages: {
    bookId: string;
    pageNumber: number;
    textChunk: string;
  }[] = [];

  for (let i = 1; i <= numPages; i++) {
    let text: string;

    if (mdPages) {
      text = mdPages[i - 1];
    } else {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text = content.items
        .map((item) => ("str" in item ? (item as { str: string }).str : ""))
        .join(" ")
        .trim();
    }

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
      textChunk: sanitizeExtractedText(text),
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
      pages.push({ bookId, pageNumber, textChunk: sanitizeExtractedText(currentPage.trim()) });
      pageNumber++;
      currentPage = p + "\n\n";
    } else {
      currentPage += p + "\n\n";
    }
  }

  if (currentPage.trim().length > 0) {
    pages.push({ bookId, pageNumber, textChunk: sanitizeExtractedText(currentPage.trim()) });
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
