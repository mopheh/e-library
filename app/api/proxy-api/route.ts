import { NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";

const KEYFILEPATH = path.join(process.cwd(), "service-account.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get("url") || "";
    const idParam = searchParams.get("id") || "";

    let fileId = idParam;
    if (!fileId && urlParam.includes("drive.google.com")) {
      const match = urlParam.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) fileId = match[1];
    }

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId or invalid URL" },
        { status: 400 }
      );
    }

    // Try public fetch first
    try {
      const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const res = await fetch(publicUrl, { redirect: "follow" });
      if (!res.ok) throw new Error("Public fetch failed");

      // Convert Node response body to web ReadableStream
      const reader = res.body!.getReader();
      const stream = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${fileId}.pdf"`,
        },
      });
    } catch {
      // Private file using Google Drive API
      const drive = google.drive({ version: "v3", auth });
      const gRes = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );

      // Convert Node stream to web ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          gRes.data.on("data", (chunk: Buffer) => controller.enqueue(chunk));
          gRes.data.on("end", () => controller.close());
          gRes.data.on("error", (err: any) => controller.error(err));
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${fileId}.pdf"`,
        },
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch PDF", details: String(err) },
      { status: 500 }
    );
  }
}
