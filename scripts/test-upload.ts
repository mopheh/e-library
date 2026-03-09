import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

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

async function testUpload() {
  const fileType = "text/plain";
  const objectKey = `books/${uuidv4()}.txt`;

  const command = new PutObjectCommand({
    Bucket: process.env.B2_BUCKET!,
    Key: objectKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  console.log("Got PRESIGNED URL:", uploadUrl);
  
  // Create a dummy file
  fs.writeFileSync("test.txt", "Hello World");
  const fileBuffer = fs.readFileSync("test.txt");

  console.log("Uploading file to URL...");
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": fileType,
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!res.ok) {
    console.error("FAILED TO UPLOAD. Status:", res.status);
    console.error("Response:", await res.text());
  } else {
    console.log("UPLOAD SUCCESS!");
  }
}

testUpload();
