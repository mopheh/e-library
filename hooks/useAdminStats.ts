import { useQuery } from "@tanstack/react-query";

interface AdminStats {
  users: number;
  courses: number;
  materials: number;
  departments: number;
  faculties: number;
  totalReadingMinutes: number;
  cbtUsage: number;
  revenue: number;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });
}
