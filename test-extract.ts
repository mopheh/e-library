import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import { extractTextWithOCR } from "./lib/ocr";

async function run() {
  console.log("Loading document...");
  const pdf = await pdfjsLib.getDocument({
    url: "EEE571 24-25 PQ.pdf",
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  console.log("Extracting text...");
  const text = await extractTextWithOCR(pdf, 1);
  console.log("Extracted text:", text.substring(0, 100));
}

run().catch(console.error);
