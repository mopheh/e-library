import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const b2KeyId = process.env.B2_KEY_ID!;
const b2AppKey = process.env.B2_APP_KEY!;
const b2BucketId = process.env.B2_BUCKET_ID!;

async function setupCors() {
  try {
    const authString = Buffer.from(b2KeyId + ":" + b2AppKey).toString("base64");
    
    // 1. Authorize Account
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
      headers: {
        Authorization: "Basic " + authString,
      },
    });
    
    if (!authRes.ok) {
      throw new Error(`Auth failed: ${authRes.statusText} ${await authRes.text()}`);
    }
    
    const authData = await authRes.json();
    const apiUrl = authData.apiInfo.storageApi.apiUrl;
    const authTok = authData.authorizationToken;

    console.log(`Successfully authorized. Updating CORS for bucket ${b2BucketId} on ${apiUrl}...`);

    // 2. Setup CORS rules
    const updateRes = await fetch(`${apiUrl}/b2api/v3/b2_update_bucket`, {
      method: "POST",
      headers: {
        Authorization: authTok,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId: authData.accountId,
        bucketId: b2BucketId,
        corsRules: [
          {
            corsRuleName: "next-js-upload",
            allowedOrigins: ["*"], // allow from anywhere for testing, or ["http://localhost:3000"]
            allowedHeaders: ["*"], 
            allowedOperations: [
              "b2_upload_file", 
              "b2_upload_part", 
              "b2_download_file_by_id", 
              "b2_download_file_by_name",
              "s3_put",
              "s3_post",
              "s3_get",
              "s3_head"
            ],
            exposeHeaders: ["x-bz-content-sha1"],
            maxAgeSeconds: 3600
          }
        ]
      })
    });

    if (!updateRes.ok) {
        throw new Error(`Update failed: ${updateRes.statusText} ${await updateRes.text()}`);
    }

    const updateData = await updateRes.json();
    console.log("CORS upated successfully:", updateData.corsRules);

  } catch (error) {
    console.error(error);
  }
}

setupCors();
