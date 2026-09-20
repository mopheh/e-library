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
import { requireRole } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";

// Covers both upload flows through this router: book materials (pdf/doc/docx/epub,
// up to 50MB) and aspirant admission-document verification (pdf/image, up to 5MB).
// Client-side dropzone limits (FileUploadDropzone's maxSizeMB/accept) are trivially
// bypassed by calling this API directly, so the real ceiling lives here.
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_PARTS = Math.ceil(MAX_FILE_SIZE_BYTES / CHUNK_SIZE_BYTES);
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "epub", "png", "jpg", "jpeg", "webp"]);

function isAllowedUpload(fileName: string, fileType: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  // Extension is the authoritative check (also used to derive the stored
  // object key); content-type is a secondary check but browsers sometimes
  // fail to sniff a MIME type (e.g. .epub) and fall back to a generic one.
  return fileType === "application/octet-stream" || ALLOWED_CONTENT_TYPES.has(fileType);
}

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

    const authCheck = await requireRole(["ADMIN", "FACULTY REP", "STUDENT"]);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const userId = authCheck.user!.id;

    const body = await req.json();
    const { action, fileName, fileType, fileSize, uploadId, key, parts } = body;
    const bucket = process.env.B2_BUCKET!;
    const deliveryEndpoint = process.env.B2_DELIVERY_ENDPOINT || "f005.backblazeb2.com";

    if (!action || action === "standard") {
      // Legacy or small file fallback
      if (!fileName || !fileType) {
        return NextResponse.json({ error: "fileName and fileType required" }, { status: 400 });
      }
      if (!isAllowedUpload(fileName, fileType)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }
      if (typeof fileSize !== "number" || fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `fileSize must be between 1 and ${MAX_FILE_SIZE_BYTES} bytes` },
          { status: 400 },
        );
      }

      const ext = fileName.split(".").pop();
      const objectKey = `books/${uuidv4()}.${ext}`;
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: fileType, // VERY IMPORTANT
        // Signed as part of the request — B2/S3 rejects a PUT whose actual
        // Content-Length doesn't match this, so a caller can't reuse this
        // URL to upload something bigger than what was declared/validated.
        ContentLength: fileSize,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
        signableHeaders: new Set(["content-length"]),
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
      if (!isAllowedUpload(fileName, fileType)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
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
      if (parts > MAX_MULTIPART_PARTS) {
        return NextResponse.json(
          { error: `Too many parts requested (max ${MAX_MULTIPART_PARTS}, implying a ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB ceiling)` },
          { status: 400 },
        );
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
    Sentry.captureException(error);
    console.error("B2 Upload Router Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
