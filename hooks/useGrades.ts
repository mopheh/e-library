"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LetterGrade } from "@/lib/grading";
import type { GradesPayload } from "@/lib/grades";

export type Grades = GradesPayload;
export type SemesterResult = GradesPayload["semesters"][number];

export interface SemesterInput {
  session: string;
  semester: "FIRST" | "SECOND";
  level: "100" | "200" | "300" | "400" | "500" | "600";
  courses: { courseId?: string | null; courseCode: string; courseTitle?: string | null; units: number; grade: LetterGrade }[];
}

const KEY = ["grades"];

async function send(url: string, method: string, body?: unknown): Promise<Grades> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
  return json;
}

export function useGrades() {
  return useQuery<Grades>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch("/api/grades");
      if (!res.ok) throw new Error("Failed to load grades");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Every write returns the full recomputed payload - write it straight into
// the cache instead of refetching.
function useGradesMutation<T>(fn: (input: T) => Promise<Grades>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => queryClient.setQueryData(KEY, data),
  });
}

export function useUpdateAcademicProfile() {
  return useGradesMutation((patch: { priorCgpa?: number | null; priorUnits?: number | null; targetCgpa?: number | null }) =>
    send("/api/grades", "PATCH", patch),
  );
}

export function useSaveSemester() {
  return useGradesMutation((input: SemesterInput) => send("/api/grades/semesters", "POST", input));
}

export function useDeleteSemester() {
  return useGradesMutation((id: string) => send(`/api/grades/semesters/${id}`, "DELETE"));
}

export function useSetSlip() {
  return useGradesMutation(({ id, slipUrl }: { id: string; slipUrl: string | null }) =>
    send(`/api/grades/semesters/${id}`, "PATCH", { slipUrl }),
  );
}

/** Opens the private result slip in a new tab via a short-lived signed link. */
export async function openSlip(id: string) {
  // Open synchronously (inside the click) so popup blockers allow it
  const tab = window.open("about:blank", "_blank");
  try {
    const res = await fetch(`/api/grades/semesters/${id}`);
    const json = await res.json();
    if (!res.ok || !json.url) throw new Error(json.error || "Couldn't open the slip");
    if (tab) tab.location.href = json.url;
    else window.location.href = json.url;
  } catch (err) {
    tab?.close();
    throw err;
  }
}
