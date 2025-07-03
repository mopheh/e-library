// hooks/useFaculties.ts
import { useQuery } from "@tanstack/react-query";

export type Faculty = {
  id: string;
  name: string;
};

const fetchFaculties = async (): Promise<Faculty[]> => {
  const res = await fetch("/api/faculty");
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch faculties");
  }

  console.log(data);
  return data;
};

export const useFaculties = () => {
  return useQuery({
    queryKey: ["faculties"],
    queryFn: fetchFaculties,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};
