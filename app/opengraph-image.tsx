import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "RCF E-Library: Your Complete Academic Study Hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public", "rcf-logo-full.png")
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          backgroundColor: "#0a0a0f",
          backgroundImage:
            "radial-gradient(circle at 25% 20%, #0057e733 0%, transparent 50%), radial-gradient(circle at 80% 80%, #0057e71a 0%, transparent 50%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={340} height={156} alt="" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "0 80px",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#e5e2e1",
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            Your Complete Academic Study Hub
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#9a9691",
              textAlign: "center",
            }}
          >
            AI-powered study tools · Digital library · Exam practice
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
