export function useB2Upload() {
  const upload = async (file: File) => {
    // 1. Get presigned upload URL from backend
    const res = await fetch("/api/b2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
      }),
    });
    
    if (!res.ok) throw new Error("Failed to get upload auth");

    const { uploadUrl, publicUrl } = await res.json();

    // 2. Upload directly from browser to B2 using PUT
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("B2 upload failed");
    }

    return publicUrl;
  };

  return { upload };
}
