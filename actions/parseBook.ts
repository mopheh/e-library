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
import wordListPath from "word-list";

const execFileAsync = promisify(execFile);

// Some scanning apps (CamScanner, Adobe Scan, etc.) bake their own rough OCR
// pass directly into a PDF's text layer. That text is neither empty nor
// short, so it previously sailed past the "does this page need OCR" check
// below untouched - garbage in, straight into RAG. Detect it by checking what
// fraction of extracted "words" are real English words: genuine prose (even
// dense technical writing) clears this easily, corrupted OCR output doesn't.
const ENGLISH_WORDS = new Set(
  fs.readFileSync(wordListPath, "utf-8").split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean),
);
const GARBLED_TEXT_MIN_TOKENS = 20; // below this, there's not enough signal to judge
const GARBLED_TEXT_VALID_RATIO_THRESHOLD = 0.55;

function isGarbledText(text: string): boolean {
  const tokens = text.match(/[a-zA-Z]{3,}/g);
  if (!tokens || tokens.length < GARBLED_TEXT_MIN_TOKENS) return false;
  let valid = 0;
  for (const token of tokens) {
    if (ENGLISH_WORDS.has(token.toLowerCase())) valid++;
  }
  return valid / tokens.length < GARBLED_TEXT_VALID_RATIO_THRESHOLD;
}

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

  // Tesseract's mean confidence (0-100) for a page it genuinely can't read
  // (handwriting, heavy noise) comes back low rather than erroring out. Below
  // this, we keep the transcription for reference but don't trust it enough
  // to embed into RAG. Starting point based on Tesseract's typical spread
  // between clean printed scans (usually 80+) and unreadable pages (often
  // under 40); tune if real-world flagging looks too aggressive/lax.
  const OCR_CONFIDENCE_THRESHOLD = 50;

  const pages: {
    bookId: string;
    pageNumber: number;
    textChunk: string;
    needsReview: boolean;
  }[] = [];

  for (let i = 1; i <= numPages; i++) {
    let text: string;
    let needsReview = false;

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
    const isLikelyGarbled = !isLikelyScannedImage && text.length > 0 && isGarbledText(text);

    if (!text || isLikelyScannedImage || isLikelyGarbled) {
      const reason = !text
        ? "no text"
        : isLikelyScannedImage
          ? `suspiciously short or watermark-only (${text.length} chars)`
          : "pre-existing text layer looks garbled (low real-word ratio)";
      console.log(`📷 Page ${i} has ${reason}. Running OCR...`);

      const ocrResult = await extractTextWithOCR(pdf, i);

      // If we already trusted the existing text, only replace it when OCR
      // found something more substantial. If we distrusted it (garbled),
      // prefer OCR's result outright - unless OCR came back with nothing, in
      // which case fall back to the original rather than losing the page.
      const shouldUseOcrText = isLikelyGarbled
        ? ocrResult.text.trim().length > 0
        : ocrResult.text.length > text.trim().length || !text;

      if (shouldUseOcrText) {
        text = ocrResult.text;
        if (text && ocrResult.confidence < OCR_CONFIDENCE_THRESHOLD) {
          console.log(`⚠️ Page ${i} OCR confidence ${ocrResult.confidence.toFixed(1)} is below threshold (likely handwritten/unreadable) - flagging for review, excluding from RAG.`);
          needsReview = true;
        }
      } else if (isLikelyGarbled) {
        // We already know the kept (pre-existing) text is unreliable, and OCR
        // didn't produce anything better - don't let it back into RAG.
        console.log(`⚠️ Page ${i}'s pre-existing text is garbled and OCR found nothing better - flagging for review, excluding from RAG.`);
        needsReview = true;
      }
    }

    pages.push({
      bookId,
      pageNumber: i,
      textChunk: sanitizeExtractedText(text),
      needsReview,
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
        // Low-confidence OCR pages are kept for reference but never embedded,
        // so they can't surface as a RAG match.
        if (page.needsReview) {
          return { ...page, embedding: null };
        }

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
            needsReview: sql`excluded.needs_review`,
          },
        });
    } catch (dbErr: any) {
      console.error(`❌ DB Insert failed for batch starting at page ${batch[0].pageNumber}:`, dbErr.message.substring(0, 300));
      throw dbErr;
    }
  }

  const needsReviewCount = pages.filter((p) => p.needsReview).length;
  const needsReview = needsReviewCount > 0;
  return { numPages, needsReview, needsReviewCount };
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

  return { numPages: pages.length, needsReview: false, needsReviewCount: 0 };
}
