"use client";

import { useQuery } from "@tanstack/react-query";

import { User } from "@/types";

export const useDepartmentId = () => {
  return useQuery({
    queryKey: ["departmentId"],
    queryFn: async (): Promise<string> => {
      const res = await fetch("/api/me");
      if (!res.ok) {
        const err = new Error("Failed to fetch department") as any;
        err.status = res.status;
        throw err;
      }
      const { departmentId } = await res.json();
      return departmentId;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
export const useUserData = () => {
  return useQuery({
    queryKey: ["mydata"],
    queryFn: async (): Promise<User> => {
      const res = await fetch("/api/me");
      if (!res.ok) {
        const err = new Error("Failed to fetch data") as any;
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
export const useAllUsers = () => {
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async (): Promise<User[]> => {
      const res = await fetch("/api/users");
      if (!res.ok) {
        const err = new Error("Failed to fetch all users") as any;
        err.status = res.status;
        throw err;
      }
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
      if (!res.ok) {
        const err = new Error("Failed to fetch Session, Try Again") as any;
        err.status = res.status;
        throw err;
      }
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
    queryFn: async (): Promise<User[]> => {
      const url = facultyId
        ? `/api/users?facultyId=${facultyId}`
        : `/api/users`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || "Failed to fetch users") as any;
        err.status = res.status;
        throw err;
      }
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
    queryFn: async (): Promise<User[]> => {
      const url = departmentId
        ? `/api/users?departmentId=${departmentId}`
        : `/api/users`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error || "Failed to fetch users") as any;
        err.status = res.status;
        throw err;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !departmentId || !!departmentId,
  });
};
