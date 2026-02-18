import { createCanvas } from "canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import Tesseract from "tesseract.js";

export async function extractTextWithOCR(pdf: any, pageNumber: number) {
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 2 }); // scale improves OCR accuracy
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  await page.render({
    canvasContext: context as any,
    viewport,
  }).promise;

  const imageBuffer = canvas.toBuffer("image/png");

  const {
    data: { text },
  } = await Tesseract.recognize(imageBuffer, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(
          `OCR Progress page ${pageNumber}:`,
          Math.round(m.progress * 100),
          "%",
        );
      }
    },
  });

  return text.trim();
}
