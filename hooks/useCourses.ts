import { useQuery } from "@tanstack/react-query"
import { ParamValue } from "next/dist/server/request/params"

export const useCourses = ({
  departmentId,
  page,
  limit,
}: {
  departmentId?: ParamValue
  page?: number
  limit?: number
}) => {
  const currentPage = page ?? 1
  const currentLimit = limit ?? 100

  const skip = (currentPage - 1) * currentLimit

  const queryKey = departmentId
    ? ["courses", departmentId, currentPage, currentLimit]
    : ["courses"]

  console.log({
    limit,
    page,
  })
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Course[]> => {
      const url = departmentId
        ? `/api/courses?departmentId=${departmentId}&skip=${skip}&limit=${currentLimit}`
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
