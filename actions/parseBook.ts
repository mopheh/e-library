
import * as pdfjsLib from "pdfjs-dist";
import {db} from "@/database/drizzle";
import {bookPages} from "@/database/schema";

pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.min.js");
export async function parsePdfPages(fileBuffer: Buffer, bookId: string) {
    const pages: { pageNumber: number; text: string }[] = [];
    const uint8Array = new Uint8Array(fileBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items
            .map((item: any) => ("str" in item ? item.str : ""))
            .filter(Boolean);
        pages.push({ pageNumber: i, text: strings.join(" ").trim() });
    }

    await db.insert(bookPages).values(
        pages.map((p) => ({ bookId, pageNumber: p.pageNumber, textChunk: p.text }))
    );

    return numPages;
}
