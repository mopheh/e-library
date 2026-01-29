import { useQuery } from "@tanstack/react-query";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["mydashboard"],
    queryFn: async () => {
      const url = `/api/users/dashboard`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 minutes
    // cacheTime: 30 * 60 * 1000,
  });
};
