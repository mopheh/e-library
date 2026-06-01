import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { Course } from "@/types"

export const useCourses = ({
  departmentId,
  page,
  limit,
  includeBorrowed,
}: {
  departmentId?: string
  page?: number
  limit?: number
  /** When true, also returns courses borrowed by this department via course_departments */
  includeBorrowed?: boolean
}) => {
  const currentPage = page ?? 1
  const currentLimit = limit ?? 100

  const skip = (currentPage - 1) * currentLimit

  const queryKey = departmentId
    ? ["courses", departmentId, currentPage, currentLimit, includeBorrowed]
    : ["courses"]

  return useQuery({
    queryKey,
    queryFn: async (): Promise<Course[]> => {
      let url: string
      if (departmentId) {
        const params = new URLSearchParams({
          departmentId,
          skip: String(skip),
          limit: String(currentLimit),
        })
        if (includeBorrowed) params.set("includeBorrowed", "true")
        url = `/api/courses?${params.toString()}`
      } else {
        url = `/api/courses`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch courses")
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !departmentId || !!departmentId,
  })
}

async function fetchCbtCourses(): Promise<Course[]> {
  const res = await fetch("/api/cbt/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export function useCbtCourses(): UseQueryResult<Course[], Error> {
  return useQuery({
    queryKey: ["cbt-courses"],
    queryFn: fetchCbtCourses,
  });
}