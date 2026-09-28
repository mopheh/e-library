import { z } from "zod";

// Shared query-string parsing for the admin performance endpoints
export const filtersSchema = z.object({
  facultyId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  level: z.enum(["100", "200", "300", "400", "500", "600"]).optional().nullable(),
});

export function parseFilters(url: URL) {
  const get = (k: string) => url.searchParams.get(k) || undefined;
  return filtersSchema.safeParse({ facultyId: get("facultyId"), departmentId: get("departmentId"), level: get("level") });
}
