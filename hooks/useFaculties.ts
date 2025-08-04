// hooks/useFaculties.ts
import { useQuery } from "@tanstack/react-query"

export type Faculty = {
  id: string
  name: string
}

const fetchFaculties = async ({
  page,
  limit,
}: {
  page: number
  limit: number
}): Promise<Faculty[]> => {
  const skip = (page - 1) * limit
  const res = await fetch(`/api/faculty?skip=${skip}&limit=${limit}`)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch faculties")
  }

  return data
}

export const useFaculties = (page: number, limit: number = 5) => {
  return useQuery({
    queryKey: ["faculties", page, limit],
    queryFn: () => fetchFaculties({ page, limit }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}
