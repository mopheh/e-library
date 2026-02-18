import { useUploadStrategy } from "./useUploadStrategy";
import { useSupabaseUpload } from "./useSupabaseUpload";
import { useB2Upload } from "./useB2Upload";
import { useCreateBook } from "./useCreateBook";

export function useBookUpload() {
  const { upload: uploadSupabase } = useSupabaseUpload();
  const { upload: uploadB2 } = useB2Upload();
  const { createBook } = useCreateBook();

  const uploadBook = async ({
    file,
    ...metadata
  }: {
    file: File;
    title: string;
    description: string;
    departmentId: string;
    type: string;
    courseIds: string[];
  }) => {
    const strategy = useUploadStrategy(file);
    if (!strategy) throw new Error("No file provided");

    const fileUrl =
      strategy === "b2" ? await uploadB2(file) : await uploadSupabase(file);

    return createBook({
      ...metadata,
      fileUrl,
    });
  };

  return { uploadBook };
}
