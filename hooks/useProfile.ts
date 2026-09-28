"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProfilePayload } from "@/lib/profile";

export type Profile = ProfilePayload;

export interface ProfileUpdate {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth: string;
  address: string;
  matricNo: string;
  facultyId: string;
  departmentId: string;
  level: "100" | "200" | "300" | "400" | "500" | "600";
}

export class ProfileSaveError extends Error {
  constructor(message: string, public field?: keyof ProfileUpdate) {
    super(message);
  }
}

const KEY = ["profile"];

export function useProfile(enabled = true) {
  return useQuery<Profile>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileUpdate) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new ProfileSaveError(json.error || "Couldn't save your details. Please try again.", json.field);
    },
    onSuccess: () =>
      Promise.all(
        // Name, department and level show up across the app.
        [KEY, ["mydata"], ["departmentId"], ["plan"], ["analytics"]].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}
