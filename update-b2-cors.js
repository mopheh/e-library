const B2 = require('backblaze-b2');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: '.env.local' });

async function run() {
  const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID, 
    applicationKey: process.env.B2_APP_KEY 
  });
  
  try {
    await b2.authorize();
    console.log("Authorized!");
    
    // get bucket to find bucketId
    const bucketName = process.env.B2_BUCKET;
    const listRes = await b2.getBucket({ bucketName: bucketName });
    
    // Note: getBucket usually expects bucketId or bucketName. Let's use listBuckets to be safe
    const allBuckets = await b2.listBuckets();
    const bucket = allBuckets.data.buckets.find(b => b.bucketName === bucketName);
    
    if (!bucket) {
      console.log("Bucket not found:", bucketName);
      return;
    }
    
    // update bucket cors
    const res = await b2.updateBucket({
      bucketId: bucket.bucketId,
      bucketType: bucket.bucketType,
      corsRules: [
          {
              corsRuleName: "S3_CORS_RULES",
              allowedOrigins: [ "http://localhost:3000", "https://localhost:3000" ],
              allowedOperations: [
                  "b2_upload_file",
                  "b2_upload_part",
                  "s3_put",
                  "s3_post",
                  "s3_head",
                  "s3_get"
              ],
              allowedHeaders: [ "*" ],
              exposeHeaders: [ "ETag", "x-amz-server-side-encryption" ],
              maxAgeSeconds: 3600
          }
      ]
    });
    console.log("CORS update applied successfully to B2 bucket:", bucketName);
  } catch(err) {
    console.error("Error setting CORS:", err.response ? err.response.data : err);
  }
}
run();
