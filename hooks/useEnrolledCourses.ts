import { useQuery } from "@tanstack/react-query";
import { Course } from "@/types";

export interface EnrolledCourse extends Course {
  semester: "FIRST" | "SECOND";
}

export function useEnrolledCourses() {
  return useQuery<EnrolledCourse[]>({
    queryKey: ["enrolled-courses"],
    queryFn: async () => {
      const res = await fetch("/api/users/courses");
      if (!res.ok) throw new Error("Failed to fetch enrolled courses");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}
