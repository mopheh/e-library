import { createCanvas, Image, Canvas, ImageData } from "canvas";
(global as any).Image = Image;
(global as any).Canvas = Canvas;
(global as any).ImageData = ImageData;

const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
import fs from "fs";
import { extractTextWithOCR } from "./lib/ocr";

async function main() {
  const fileBuffer = fs.readFileSync("./EEE571 24-25 PQ.pdf");
  const uint8Array = new Uint8Array(fileBuffer);
  
  const pdf = await pdfjsLib.getDocument({
    data: uint8Array,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  console.log("PDF loaded, pages:", pdf.numPages);
  
  try {
    const text = await extractTextWithOCR(pdf, 1);
    console.log("Extracted text length:", text.length);
    console.log(text.substring(0, 50));
  } catch (err) {
    console.error("Error extracting text:", err);
  }
}

main().catch(console.error);
