"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Plan } from "@/lib/planner";

export type { Plan, PlanCourse } from "@/lib/planner";

const KEY = ["plan"];

export function usePlan(enabled = true) {
  return useQuery<Plan>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch("/api/plan");
      if (!res.ok) throw new Error("Failed to load your plan");
      return res.json();
    },
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useUpdatePlanSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { weeklyMinutes?: number; planSemester?: "FIRST" | "SECOND" | null }) => {
      const res = await fetch("/api/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't save your plan");
      return json as Plan;
    },
    onSuccess: (plan) => queryClient.setQueryData(KEY, plan),
  });
}
