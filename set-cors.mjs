import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const s3Client = new S3Client({
  region: "us-east-005", // Default B2 region emulation
  endpoint: process.env.B2_ENDPOINT?.startsWith("http")
    ? process.env.B2_ENDPOINT
    : `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY,
  },
  forcePathStyle: true,
});

const run = async () => {
  try {
    const bucket = process.env.B2_BUCKET;
    console.log("Applying complete CORS rules for Backblaze bucket:", bucket);
    
    const command = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "HEAD", "OPTIONS"],
            AllowedOrigins: ["*"],
            ExposeHeaders: [
              "ETag", 
              "x-amz-server-side-encryption", 
              "Content-Range", 
              "Accept-Ranges", 
              "Content-Length",
              "Content-Type"
            ],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });

    const response = await s3Client.send(command);
    console.log("[SUCCESS] CORS payload accepted by Backblaze B2:", response.$metadata.httpStatusCode);
  } catch (err) {
    console.error("[ERROR] Failed to set CORS:", err);
  }
};

run();
