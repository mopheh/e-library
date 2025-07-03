import { useQuery } from "@tanstack/react-query";

export const useUsers = (facultyId?: string) => {
  const queryKey = facultyId ? ["users", facultyId] : ["users"];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = facultyId
        ? `/api/users?facultyId=${facultyId}`
        : `/api/users`;
      const res = await fetch(url);
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !facultyId || !!facultyId,
  });
};
