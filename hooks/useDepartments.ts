import { useQuery } from "@tanstack/react-query"
export type Department = {
  id: string
  name: string
}
export const useDepartments = ({
  facultyId,
  page,
  limit,
}: {
  facultyId?: string
  page?: number
  limit?: number
}) => {
  const currentPage = page ?? 1
  const currentLimit = limit ?? 100

  const skip = (currentPage - 1) * currentLimit

  const queryKey = facultyId
    ? ["departments", facultyId]
    : ["departments", currentPage, currentLimit]
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Department[]> => {
      const url = facultyId
        ? `/api/departments?facultyId=${facultyId}&skip=${skip}&limit=${currentLimit}`
        : `/api/departments?skip=${skip}&limit=${5}`
      const res = await fetch(url)
      const data = await res.json()
      console.log(data)
      if (!res.ok) throw new Error(data.error || "Failed to fetch departments")
      return data
    },
    staleTime: 5 * 60 * 1000,
    // enabled: !facultyId || !!facultyId,
  })
}
export const useDepartment = (departmentId?: string) => {
  const queryKey = ["departments", departmentId]
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Department[]> => {
      const url = `/api/departments?departmentId=${departmentId}`
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
