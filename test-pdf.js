const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
let canvasModule;
try {
  canvasModule = require("pdfjs-dist/node_modules/canvas");
} catch(e) {
  canvasModule = require("canvas");
}

const { createCanvas, Image, Canvas, ImageData } = canvasModule;

async function run() {
  global.Image = Image;
  global.Canvas = Canvas;
  global.ImageData = ImageData;
  delete global.createImageBitmap;

  class NodeCanvasFactory {
    create(width, height) {
      const _canvas = createCanvas(width, height);
      return {
        canvas: _canvas,
        context: _canvas.getContext("2d"),
      };
    }
    reset(canvasAndContext, width, height) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  }

  const pdf = await pdfjsLib.getDocument({
    url: "EEE571 24-25 PQ.pdf",
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  console.log("Rendering page...");
  await page.render({
    canvasContext: context,
    viewport,
    canvasFactory: new NodeCanvasFactory(),
  }).promise;

  console.log("Rendered successfully!");
}

run().catch(console.error);
