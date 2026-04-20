export function useB2Upload() {
  const upload = (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

        if (file.size <= CHUNK_SIZE) {
          // --- STANDARD UPLOAD (<5MB) ---
          const res = await fetch("/api/b2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "standard",
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
            }),
          });
          
          if (!res.ok) throw new Error("Failed to get upload auth");
          const { uploadUrl, publicUrl } = await res.json();
          
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              onProgress(percentComplete);
            }
          });
          
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(publicUrl);
            } else {
              reject(new Error(`B2 upload failed: ${xhr.statusText}`));
            }
          });
          
          xhr.addEventListener("error", () => reject(new Error("B2 upload failed due to network error")));
          xhr.addEventListener("abort", () => reject(new Error("B2 upload aborted")));
          
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.send(file);
          
        } else {
          // --- MULTIPART UPLOAD (>5MB) ---
          // 1. Create Multipart Upload
          const createRes = await fetch("/api/b2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "createMultipartUpload",
              fileName: file.name,
              fileType: file.type || "application/octet-stream",
            }),
          });

          if (!createRes.ok) throw new Error("Failed to initialize multipart upload");
          const { uploadId, key } = await createRes.json();

          const totalParts = Math.ceil(file.size / CHUNK_SIZE);

          // 2. Get Presigned URLs for all parts
          const urlsRes = await fetch("/api/b2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "getPresignedPartUrls",
              uploadId,
              key,
              parts: totalParts,
            }),
          });

          if (!urlsRes.ok) throw new Error("Failed to get part URLs");
          const { presignedUrls } = await urlsRes.json();

          const completedParts: { PartNumber: number; ETag: string }[] = [];
          let uploadedBytes = 0;

          // 3. Upload Parts Sequentially or in Batches (doing sequentially for stability)
          for (let i = 0; i < totalParts; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const partInfo = presignedUrls[i];

            await new Promise<void>((partResolve, partReject) => {
              const xhr = new XMLHttpRequest();
              
              xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable && onProgress) {
                  const currentTotalUploaded = uploadedBytes + event.loaded;
                  const percentComplete = Math.round((currentTotalUploaded / file.size) * 100);
                  onProgress(percentComplete);
                }
              });

              xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  let etag = xhr.getResponseHeader("ETag");
                  if (etag) {
                    // Normalize ETag just in case
                    etag = etag.replace(/"/g, "");
                    completedParts.push({ PartNumber: partInfo.partNumber, ETag: etag });
                    uploadedBytes += chunk.size;
                    partResolve();
                  } else {
                    partReject(new Error("No ETag returned for part"));
                  }
                } else {
                  partReject(new Error(`Part upload failed: ${xhr.statusText}`));
                }
              });

              xhr.addEventListener("error", () => partReject(new Error("Part upload network error")));
              xhr.addEventListener("abort", () => partReject(new Error("Part upload aborted")));

              xhr.open("PUT", partInfo.url, true);
              // Do NOT set Content-Type mapping for parts in S3 presigned URLs unless strictly defined!
              xhr.send(chunk);
            });
          }

          // 4. Complete Multipart Upload
          const completeRes = await fetch("/api/b2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "completeMultipartUpload",
              uploadId,
              key,
              parts: completedParts.sort((a, b) => a.PartNumber - b.PartNumber),
            }),
          });

          if (!completeRes.ok) throw new Error("Failed to complete multipart upload");
          const { publicUrl } = await completeRes.json();
          resolve(publicUrl);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  return { upload };
}
