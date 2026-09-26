"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type StudyMethod = "TEXTBOOK" | "NOTES" | "PAST_QUESTIONS" | "GROUP" | "OTHER";

export interface StudyLog {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  date: string;
  timesRead: number;
  minutes: number | null;
  method: StudyMethod;
  note: string | null;
  createdAt: string;
}

export interface CourseWeek {
  courseId: string;
  courseCode: string;
  title: string;
  manualTimes: number;
  manualMinutes: number;
  appMinutes: number;
  lastStudied: string | null;
}

export interface NewStudyLog {
  courseId: string;
  date: string;
  timesRead: number;
  minutes?: number | null;
  method: StudyMethod;
  note?: string;
}

const KEY = ["study-logs"];

export function useStudyLogs() {
  return useQuery<{ logs: StudyLog[]; weekly: CourseWeek[]; today: string }>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch("/api/study-logs");
      if (!res.ok) throw new Error("Failed to load study log");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// Logging changes streak, minutes, heatmap, goal progress and the plan too.
function useInvalidateStudyStats() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: KEY }),
      queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
      queryClient.invalidateQueries({ queryKey: ["plan"] }),
    ]);
}

export function useLogStudy() {
  const invalidate = useInvalidateStudyStats();
  return useMutation({
    mutationFn: async (input: NewStudyLog) => {
      const res = await fetch("/api/study-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't save your log");
      return body.log as { id: string; courseCode: string };
    },
    // Not awaited: the caller shouldn't wait on three refetches
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteStudyLog() {
  const invalidate = useInvalidateStudyStats();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/study-logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't delete this log");
    },
    // Not awaited: the caller shouldn't wait on three refetches
    onSuccess: () => {
      invalidate();
    },
  });
}
