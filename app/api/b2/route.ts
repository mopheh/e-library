import { NextResponse } from "next/server";
import { 
  S3Client, 
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
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
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, fileName, fileType, uploadId, key, parts } = body;
    const bucket = process.env.B2_BUCKET!;
    const deliveryEndpoint = process.env.B2_DELIVERY_ENDPOINT || "f005.backblazeb2.com";

    if (!action || action === "standard") {
      // Legacy or small file fallback
      if (!fileName || !fileType) {
        return NextResponse.json({ error: "fileName and fileType required" }, { status: 400 });
      }

      const ext = fileName.split(".").pop();
      const objectKey = `books/${uuidv4()}.${ext}`;
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: fileType, // VERY IMPORTANT
      });
      
      const uploadUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600,
        signableHeaders: new Set(),
      });

      return NextResponse.json({
        uploadUrl,
        objectKey,
        publicUrl: `https://${deliveryEndpoint}/file/${bucket}/${objectKey}`,
      });
    }

    if (action === "createMultipartUpload") {
      if (!fileName || !fileType) {
        return NextResponse.json({ error: "fileName and fileType required" }, { status: 400 });
      }
      
      const ext = fileName.split(".").pop();
      const objectKey = `books/${uuidv4()}.${ext}`;

      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: fileType,
      });

      const response = await s3Client.send(command);
      
      return NextResponse.json({
        uploadId: response.UploadId,
        key: response.Key,
      });
    }

    if (action === "getPresignedPartUrls") {
      if (!key || !uploadId || !parts) {
        return NextResponse.json({ error: "Missing required params" }, { status: 400 });
      }

      const presignedUrls = [];
      for (let i = 1; i <= parts; i++) {
        const command = new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: i,
        });
        const url = await getSignedUrl(s3Client, command, { 
          expiresIn: 3600,
          signableHeaders: new Set(),
        });
        presignedUrls.push({ partNumber: i, url });
      }
      return NextResponse.json({ presignedUrls });
    }

    if (action === "completeMultipartUpload") {
      if (!key || !uploadId || !parts) {
        return NextResponse.json({ error: "Missing required params" }, { status: 400 });
      }

      const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          // parts must be array of { PartNumber, ETag }
          Parts: parts,
        },
      });

      await s3Client.send(command);
      return NextResponse.json({
         publicUrl: `https://${deliveryEndpoint}/file/${bucket}/${key}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("B2 Upload Router Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
