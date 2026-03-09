import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import Tesseract from "tesseract.js";
import fs from "fs";
import os from "os";
import path from "path";

export async function extractTextWithOCR(pdf: any, pageNumber: number) {
  let canvasModule: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    canvasModule = eval('require("canvas")');
  } catch (err) {
    // ignore
  }

  const { createCanvas, Image, Canvas, ImageData } = canvasModule;

  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 2 }); // scale improves OCR accuracy
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  // PDF.js needs to know what an "Image" object is in Node.js when painting XObjects
  class NodeCanvasFactory {
    create(width: number, height: number) {
      const _canvas = createCanvas(width, height);
      return {
        canvas: _canvas,
        context: _canvas.getContext("2d"),
      };
    }
    reset(canvasAndContext: any, width: number, height: number) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext: any) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  }

  // Inject Image, Canvas, ImageData into the global scope temporarily if PDF.js looks for it there 
  const originalImage = (globalThis as any).Image;
  const originalCanvas = (globalThis as any).Canvas;
  const originalImageData = (globalThis as any).ImageData;
  const originalCreateImageBitmap = (globalThis as any).createImageBitmap;

  (globalThis as any).Image = Image;
  (globalThis as any).Canvas = Canvas;
  (globalThis as any).ImageData = ImageData;
  
  // CRITICAL FIX: Node.js 20+ has a native createImageBitmap that node-canvas DOES NOT support. 
  // We must hide it so PDF.js doesn't generate ImageBitmaps that crash ctx.drawImage.
  delete (globalThis as any).createImageBitmap;

  try {
    await page.render({
      canvasContext: context as any,
      viewport,
      canvasFactory: new NodeCanvasFactory(),
    }).promise;
  } finally {
    if (originalImage !== undefined) (globalThis as any).Image = originalImage;
    else delete (globalThis as any).Image;

    if (originalCanvas !== undefined) (globalThis as any).Canvas = originalCanvas;
    else delete (globalThis as any).Canvas;

    if (originalImageData !== undefined) (globalThis as any).ImageData = originalImageData;
    else delete (globalThis as any).ImageData;

    if (originalCreateImageBitmap !== undefined) (globalThis as any).createImageBitmap = originalCreateImageBitmap;
  }

  const imageBuffer = canvas.toBuffer("image/png");
  const tmpPath = path.join(os.tmpdir(), `ocr_${Date.now()}_${pageNumber}.png`);
  fs.writeFileSync(tmpPath, imageBuffer);

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(tmpPath, "eng", {
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
  } finally {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }
}
