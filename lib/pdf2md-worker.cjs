// Runs @opendocsg/pdf2md in its own process.
//
// pdf2md depends on `unpdf`, which bundles its own internal copy of pdf.js.
// Loading that inside the same process as our top-level `pdfjs-dist` import
// (used elsewhere for OCR page rendering) corrupts a global singleton pdf.js
// uses to track its worker version, permanently breaking every later
// `pdfjsLib.getDocument()` call in that process with:
//   "The API version ... does not match the Worker version ..."
// Since the background worker is long-lived and processes many books, that
// corruption would silently break OCR for every book parsed after the first
// one that used pdf2md. Running pdf2md here, in a throwaway child process,
// keeps that pollution fully isolated from the parent.
//
// This file is a plain CommonJS script invoked directly via `node`, not part
// of the TypeScript app bundle, so it intentionally uses require().
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  const pdf2md = require("@opendocsg/pdf2md");
  const buffer = fs.readFileSync(inputPath);
  const markdown = await pdf2md(new Uint8Array(buffer));
  fs.writeFileSync(outputPath, markdown, "utf-8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
