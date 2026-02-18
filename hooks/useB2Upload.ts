export function useB2Upload() {
  const upload = async (file: File) => {
    // 1. Get signed upload details from backend
    const res = await fetch("/api/b2");
    if (!res.ok) throw new Error("Failed to get upload auth");

    const { uploadUrl, authorizationToken, fileName } = await res.json();

    // 2. Upload directly from browser to B2
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": file.type || "application/octet-stream",
        "X-Bz-Content-Sha1": "do_not_verify",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("B2 upload failed");
    }

    const data = await uploadRes.json();

    return `https://${process.env.B2_ENDPOINT}/file/${process.env.B2_BUCKET}/${data.fileName}`;
  };

  return { upload };
}
