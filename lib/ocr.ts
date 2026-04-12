import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import Tesseract from "tesseract.js";
import fs from "fs";
import os from "os";
import path from "path";

interface CanvasModule {
  createCanvas: (width: number, height: number) => any;
  Image: new () => any;
  Canvas: new () => any;
  ImageData: new (width: number, height: number) => any;
}

export async function extractTextWithOCR(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number) {
  let canvasModule: CanvasModule | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    canvasModule = eval('require("canvas")') as CanvasModule;
  } catch (err) {
    // ignore
  }

  if (!canvasModule) {
    throw new Error("Canvas module is not available");
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
    reset(canvasAndContext: { canvas: any; context: any }, width: number, height: number) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext: { canvas: any; context: any }) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  }

  // Inject Image, Canvas, ImageData into the global scope temporarily if PDF.js looks for it there 
  const global = globalThis as unknown as Record<string, unknown>;
  const originalImage = global.Image;
  const originalCanvas = global.Canvas;
  const originalImageData = global.ImageData;
  const originalCreateImageBitmap = global.createImageBitmap;

  global.Image = Image;
  global.Canvas = Canvas;
  global.ImageData = ImageData;
  
  // CRITICAL FIX: Node.js 20+ has a native createImageBitmap that node-canvas DOES NOT support. 
  // We must hide it so PDF.js doesn't generate ImageBitmaps that crash ctx.drawImage.
  delete global.createImageBitmap;

  try {
    await page.render({
      canvasContext: context,
      viewport,
      canvasFactory: new NodeCanvasFactory(),
    }).promise;
  } finally {
    if (originalImage !== undefined) global.Image = originalImage;
    else delete global.Image;

    if (originalCanvas !== undefined) global.Canvas = originalCanvas;
    else delete global.Canvas;

    if (originalImageData !== undefined) global.ImageData = originalImageData;
    else delete global.ImageData;

    if (originalCreateImageBitmap !== undefined) global.createImageBitmap = originalCreateImageBitmap;
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
