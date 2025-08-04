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
  const queryKey = facultyId
    ? ["departments", facultyId]
    : ["departments", page, limit]
  const skip = (page - 1) * limit
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Department[]> => {
      const url = facultyId
        ? `/api/departments?facultyId=${facultyId}&skip=${skip}&limit=${limit}`
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
