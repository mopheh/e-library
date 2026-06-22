import { useQuery } from "@tanstack/react-query";
import { Course } from "@/types";

export interface WorkspaceBook {
  id: string;
  title: string;
  description: string;
  type: string;
  departmentId: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  pageCount?: number | null;
  parseStatus?: string | null;
  createdAt?: string | Date | null;
}

export interface WorkspaceData {
  course: Course & { examDate?: string | null };
  books: WorkspaceBook[];
  materialsByType: Record<string, WorkspaceBook[]>;
  stats: {
    totalBooks: number;
    indexedPages: number;
    questionsCount: number;
    aiReady: boolean;
  };
}

export function useWorkspace(courseId: string | undefined) {
  return useQuery<WorkspaceData>({
    queryKey: ["workspace", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${courseId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch workspace");
      return data;
    },
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
  });
}
