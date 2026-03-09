import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

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

async function main() {
  try {
    const bucket = process.env.B2_BUCKET!;
    console.log(`Setting CORS for S3 Bucket: ${bucket}`);
    
    const putCommand = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "POST", "GET", "HEAD", "DELETE"],
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });

    await s3Client.send(putCommand);
    console.log("Successfully set S3 CORS rules");

    // Verify
    const getCommand = new GetBucketCorsCommand({ Bucket: bucket });
    const verify = await s3Client.send(getCommand);
    console.log("Verified CORS:", JSON.stringify(verify.CORSRules, null, 2));

  } catch (err) {
    console.error("Error setting S3 CORS:", err);
  }
}

main();
