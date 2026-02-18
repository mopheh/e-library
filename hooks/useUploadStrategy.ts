const MAX_SUPABASE_MB = 50;

export function useUploadStrategy(file: File | null) {
  if (!file) return null;

  const sizeInMB = file.size / (1024 * 1024);

  return sizeInMB > MAX_SUPABASE_MB ? "b2" : "supabase";
}
