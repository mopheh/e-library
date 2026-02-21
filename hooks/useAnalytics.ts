import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AnalyticsData {
  kpis: {
    booksRead: number;
    minutesRead: number;
    streak: number;
  };
  heatmap: { date: string; count: number; value: number }[];
  weeklyTrends: { date: string; minutes: number; day: string }[];
}

export const useAnalytics = () => {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

interface Goal {
  id: string;
  type: string;
  target: number;
  frequency: string;
  currentProgress?: number;
}

export const useGoals = () => {
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useMutationGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Partial<Goal>) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });
      if (!res.ok) throw new Error("Failed to save goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
};

interface AIInsightsData {
  insights: string[];
}

export const useAIInsights = () => {
  return useQuery<AIInsightsData>({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const res = await fetch("/api/ai-insights");
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
