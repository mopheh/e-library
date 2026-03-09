const { extractTextWithOCR } = require("./lib/ocr");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const fs = require("fs");

async function main() {
    const fileBuffer = fs.readFileSync("./node_modules/pdf-parse/test/data/01-valid.pdf");
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
        console.log("Extracted text:");
        console.log(text);
    } catch (err) {
        console.error("Error extracting text:", err);
    }
}

main().catch(console.error);
