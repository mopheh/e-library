import { useQuery } from "@tanstack/react-query"

export const useCourses = ({
  departmentId,
  page,
  limit,
}: {
  departmentId?: string
  page?: number
  limit?: number
}) => {
  const queryKey = departmentId
    ? ["courses", departmentId, page, limit]
    : ["courses"]

  const skip = (page - 1) * limit
  console.log({
    limit,
    page,
  })
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Course[]> => {
      const url = departmentId
        ? `/api/courses?departmentId=${departmentId}&skip=${skip}&limit=${limit}`
        : `/api/courses`
      const res = await fetch(url)
      const data = await res.json()
      console.log(data)
      if (!res.ok) throw new Error(data.error || "Failed to fetch departments")
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !departmentId || !!departmentId,
  })
}
