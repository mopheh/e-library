import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

export function b2KeyFromUrl(fileUrl: string): string | null {
  const match = fileUrl.match(/\/file\/[^/]+\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function deleteB2File(fileUrl: string) {
  const key = b2KeyFromUrl(fileUrl);
  if (!key) return;
  await deleteB2Key(key);
}

export async function deleteB2Key(key: string) {
  const bucket = process.env.B2_BUCKET!;
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Lists every object under `prefix` last modified before `olderThan` —
 * used by the orphaned-upload sweep to find files a client got a presigned
 * URL for and uploaded straight to B2, but never registered via
 * POST /api/books (so nothing in the app ever points at them and they'd
 * otherwise sit there forever, quietly costing storage).
 */
export async function listB2ObjectsOlderThan(prefix: string, olderThan: Date) {
  const bucket = process.env.B2_BUCKET!;
  const results: { key: string; lastModified: Date }[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of page.Contents ?? []) {
      if (obj.Key && obj.LastModified && obj.LastModified < olderThan) {
        results.push({ key: obj.Key, lastModified: obj.LastModified });
      }
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  return results;
}
