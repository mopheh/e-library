import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const b2KeyId = process.env.B2_KEY_ID!;
const b2AppKey = process.env.B2_APP_KEY!;
const b2BucketId = process.env.B2_BUCKET_ID!;

async function createKey() {
  try {
    const authString = Buffer.from(`${b2KeyId}:${b2AppKey}`).toString("base64");
    
    // Authorize
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
      headers: { Authorization: `Basic ${authString}` },
    });
    
    if (!authRes.ok) throw new Error(`Auth failed: ${await authRes.text()}`);
    const authData = await authRes.json();
    const apiUrl = authData.apiInfo.storageApi.apiUrl;
    const authTok = authData.authorizationToken;

    console.log("Authorized. Creating new S3 compatible Application Key...");
    
    const capabilities = [
      "listBuckets", "listFiles", "readFiles", "shareFiles", "writeFiles", "deleteFiles",
      "readBucketEncryption", "writeBucketEncryption", "readBucketRetentions", "writeBucketRetentions"
    ];

    const createRes = await fetch(`${apiUrl}/b2api/v3/b2_create_key`, {
      method: "POST",
      headers: {
        Authorization: authTok,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId: authData.accountId,
        capabilities,
        keyName: "univault-s3-upload-key-" + Date.now(),
        bucketId: b2BucketId,
      }),
    });

    if (!createRes.ok) {
        throw new Error(`Create key failed: ${await createRes.text()}`);
    }

    const { applicationKeyId, applicationKey } = await createRes.json();
    console.log("Successfully created new Application Key.");
    console.log("applicationKeyId:", applicationKeyId);
    
    // Read and update .env.local
    let envData = fs.readFileSync(".env.local", "utf-8");
    envData = envData.replace(/B2_KEY_ID=.*/g, `B2_KEY_ID=${applicationKeyId}`);
    envData = envData.replace(/B2_APP_KEY=.*/g, `B2_APP_KEY=${applicationKey}`);
    
    fs.writeFileSync(".env.local", envData);
    console.log("Updated .env.local with new S3 compatible key credentials.");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

createKey();
