import { useQuery } from "@tanstack/react-query";

export const useDepartments = (facultyId?: string) => {
  const queryKey = facultyId ? ["departments", facultyId] : ["departments"];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = facultyId
        ? `/api/departments?facultyId=${facultyId}`
        : `/api/departments`;
      const res = await fetch(url);
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.error || "Failed to fetch departments");
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !facultyId || !!facultyId,
  });
};
