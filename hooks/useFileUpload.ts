// hooks/useSupabaseUpload.ts
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    const filename = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("books")
      .upload(filename, file);
    setUploading(false);

    if (error) {
      setError(error.message);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from("books")
      .getPublicUrl(filename); // or use .createSignedUrl() if private

    return urlData.publicUrl;
  };

  return { uploadFile, uploading, error };
}
