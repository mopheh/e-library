import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: "us-east-005",
  endpoint: process.env.B2_ENDPOINT?.startsWith("http")
    ? process.env.B2_ENDPOINT
    : `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
  forcePathStyle: true,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    // Preserve the original file extension
    const ext = fileName.split(".").pop();
    const objectKey = `books/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: objectKey,
      ContentType: fileType,
    });

    // Create the presigned URL with a 1 hour expiration
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    const deliveryEndpoint = process.env.B2_DELIVERY_ENDPOINT || "f005.backblazeb2.com";
    return NextResponse.json({
      uploadUrl,
      objectKey,
      publicUrl: `https://${deliveryEndpoint}/file/${process.env.B2_BUCKET}/${objectKey}`,
    });
  } catch (error: any) {
    console.error("Presigned URL error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
