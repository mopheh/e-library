import { useQuery } from "@tanstack/react-query"
import { Department } from "@/types"

export const useDepartments = ({
  facultyId,
  page,
  limit,
  search,
}: {
  facultyId?: string
  page?: number
  limit?: number
  search?: string
}) => {
  const currentPage = page ?? 1
  const currentLimit = limit ?? 1000

  const skip = (currentPage - 1) * currentLimit

  const queryKey = ["departments", facultyId, currentPage, currentLimit, search]
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Department[]> => {
      let url = `/api/departments?skip=${skip}&limit=${currentLimit}`
      if (facultyId) url += `&facultyId=${facultyId}`
      if (search) url += `&search=${encodeURIComponent(search)}`

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
    queryFn: async (): Promise<Department> => {
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
