import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import B2 from "backblaze-b2";
const s3 = new S3Client({
    region: "us-east-005", // backblaze default region
    endpoint: process.env.B2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APP_KEY!,
    },
});


export const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID!,   // from Backblaze
    applicationKey: process.env.B2_APP_KEY!,    // from Backblaze
});

export async function authorizeB2() {
    if (!b2.authorizationToken) {
        await b2.authorize(); // gets auth + API URLs
    }
}
export async function POST(req: Request) {
    try {
        await authorizeB2();
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        //
        // const arrayBuffer = await file.arrayBuffer();
        // const buffer = Buffer.from(arrayBuffer);
        //
        // const key = `books/${Date.now()}-${file.name}`;
        //
        // await s3.send(
        //     new PutObjectCommand({
        //         Bucket: process.env.B2_BUCKET!,
        //         Key: key,
        //         Body: buffer,
        //         ContentType: file.type,
        //     })
        // );
// 1. Get upload URL
        const { data: uploadAuth } = await b2.getUploadUrl({
            bucketId: process.env.B2_BUCKET_ID!,
        });

        // 2. Upload file
        const buffer1 = Buffer.from(await file.arrayBuffer());
        const { data: uploaded } = await b2.uploadFile({
            uploadUrl: uploadAuth.uploadUrl,
            uploadAuthToken: uploadAuth.authorizationToken,
            fileName: file.name,
            data: buffer1,
        });

        // const fileUrl = `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET}/${key}`;
        console.log(uploaded)
        return NextResponse.json({ url: ""});
    } catch (error: any) {
        console.error("B2 upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
