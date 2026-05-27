import "dotenv/config";
import { authorizeB2, b2 } from "./lib/utils";

async function run() {
  await authorizeB2();
  
  const fileUrl = "https://f005.backblazeb2.com/file/univault-books/books/14a6db21-a67c-44e5-8af1-f4ac8941a971/1kT50RYDV-QTbd5j3hJsgx3-q3sKib9Ei-PRE572SolutionPack.pdf";
  const url = new URL(fileUrl);
  const parts = url.pathname.split("/");
  const bucketIndex = parts.indexOf("univault-books");
  const fileName = (bucketIndex !== -1 && bucketIndex + 1 < parts.length)
    ? parts.slice(bucketIndex + 1).join("/")
    : parts.pop() || "";

  console.log("FileNamePrefix:", fileName);
  console.log("Bucket ID:", process.env.B2_BUCKET_ID);

  try {
    const auth = await b2.getDownloadAuthorization({
      bucketId: process.env.B2_BUCKET_ID!,
      fileNamePrefix: decodeURIComponent(fileName),
      validDurationInSeconds: 60 * 60,
    });

    const signedUrl = `${fileUrl}?Authorization=${auth.data.authorizationToken}`;
    console.log("Signed URL:", signedUrl);

    const response = await fetch(signedUrl);
    console.log("Response Status:", response.status);
    if (!response.ok) {
        console.log("Error body:", await response.text());
    } else {
        console.log("Headers:", response.headers);
    }
  } catch(e) {
    console.error("Error:", (e as any).response ? (e as any).response.data : e);
  }
}

run();
