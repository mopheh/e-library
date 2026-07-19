import { useQuery } from "@tanstack/react-query";

export interface DepartmentBookCount {
  departmentId: string;
  departmentName: string;
  facultyId: string | null;
  facultyName: string | null;
  bookCount: number;
}

export interface BookTypeCount {
  type: string;
  count: number;
}

export interface AdminMaterialsOverview {
  totalBooks: number;
  totalDepartments: number;
  departmentsWithZero: number;
  departmentsCovered: number;
  byDepartment: DepartmentBookCount[];
  byType: BookTypeCount[];
}

export function useAdminMaterials() {
  return useQuery<AdminMaterialsOverview>({
    queryKey: ["admin-materials"],
    queryFn: async () => {
      const res = await fetch("/api/admin/materials");
      if (!res.ok) throw new Error("Failed to fetch materials overview");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}
