import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const BUCKET_NAME = process.env.B2_BUCKET || "univault-books";

async function run() {
  try {
    // 1. Authorize Account
    const authString = Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        "Authorization": `Basic ${authString}`
      }
    });

    if (!authRes.ok) throw new Error(`Auth failed: ${await authRes.text()}`);
    const authData = await authRes.json();
    const { authorizationToken, apiUrl, accountId } = authData;

    // 2. We must get the bucket_id to update it
    const listRes = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets?accountId=${accountId}`, {
      headers: { "Authorization": authorizationToken }
    });
    const listData = await listRes.json();
    const bucket = listData.buckets.find(b => b.bucketName === BUCKET_NAME);
    
    if (!bucket) throw new Error("Bucket not found.");

    // 3. Apply the custom CORS rule for the user
    // To preserve other properties, we pass bucketType and bucketId natively.
    const updateRes = await fetch(`${apiUrl}/b2api/v2/b2_update_bucket`, {
      method: "POST",
      headers: {
        "Authorization": authorizationToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accountId,
        bucketId: bucket.bucketId,
        bucketType: bucket.bucketType,
        corsRules: [
          {
            corsRuleName: "univault-upload",
            allowedOrigins: ["http://localhost:3000"],
            allowedOperations: ["s3_put", "s3_get", "s3_head"],
            allowedHeaders: ["content-type"],
            exposeHeaders: ["ETag"],
            maxAgeSeconds: 3600
          }
        ]
      })
    });

    const updateData = await updateRes.json();
    console.log(JSON.stringify(updateData, null, 2));

  } catch (error) {
    console.error(JSON.stringify({ error: error.message }, null, 2));
  }
}

run();
