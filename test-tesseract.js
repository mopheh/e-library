const { createCanvas } = require("canvas");
const Tesseract = require("tesseract.js");

async function run() {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = "black";
    ctx.font = "30px Impact";
    ctx.fillText("HELLO WORLD", 10, 100);

    const buffer = canvas.toBuffer("image/png");
    console.log("Buffer is Buffer?", Buffer.isBuffer(buffer));

    try {
        const { data: { text } } = await Tesseract.recognize(buffer, "eng");
        console.log("Extracted text with Buffer:", text.trim());
    } catch (err) {
        console.error("Error recognizing Buffer:", err);
    }

    try {
        // maybe try passing the raw unencoded image? Or base64?
        // tesseract accepts base64: "data:image/png;base64,..."
        const b64 = canvas.toDataURL();
        console.log("Trying data URL instead...");
        const { data: { text } } = await Tesseract.recognize(b64, "eng");
        console.log("Extracted text with Data URL:", text.trim());
    } catch (err) {
        console.error("Error recognizing Data URL:", err);
    }
}

run();
