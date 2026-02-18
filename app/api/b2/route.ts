import { authorizeB2, b2 } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  await authorizeB2();

  const { data } = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID!,
  });

  return NextResponse.json({
    uploadUrl: data.uploadUrl,
    authorizationToken: data.authorizationToken,
    fileName: crypto.randomUUID(),
  });
}
