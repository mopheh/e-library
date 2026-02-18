import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export function useSupabaseUpload() {
  const upload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `books/${uuidv4()}.${ext}`;

    const { error } = await supabase.storage.from("books").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("books").getPublicUrl(path);

    return data.publicUrl;
  };

  return { upload };
}
