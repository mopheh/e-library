import { useQuery } from "@tanstack/react-query";

export const useDepartmentId = () => {
  return useQuery({
    queryKey: ["departmentId"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("Failed to fetch department");
      const { departmentId } = await res.json();
      return departmentId;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
export const useUserData = () => {
  return useQuery({
    queryKey: ["mydata"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
export const useAllUsers = () => {
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
export const useReadingSession = () => {
  const queryKey = ["sessions"];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch("/api/users/reading-session");
      if (!res.ok) throw new Error("Failed to fetch Session, Try Again");
      const data = await res.json();
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

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

export const useDepartmentUsers = (departmentId?: string) => {
  const queryKey = departmentId ? ["users", departmentId] : ["users"];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = departmentId
        ? `/api/users?departmentId=${departmentId}`
        : `/api/users`;
      const res = await fetch(url);
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !departmentId || !!departmentId,
  });
};
