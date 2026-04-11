"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCourses } from "@/hooks/useCourses";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type EnrolledCourse = {
  id: string;
  courseCode: string;
};

export function CourseRegistrationModal({ departmentId }: { departmentId?: string }) {
  const [open, setOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch available courses for the department
  const { data: availableCourses, isLoading: loadingCourses } = useCourses({
    departmentId,
    limit: 100, // Make sure we get all
  });

  // Fetch currently enrolled courses
  const { data: enrolledCourses, isLoading: loadingEnrolled } = useQuery({
    queryKey: ["enrolled-courses"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/users/courses", { signal });
      if (!res.ok) throw new Error("Failed to fetch enrolled courses");
      return res.json() as Promise<EnrolledCourse[]>;
    },
  });

  // Check if we need to force open the modal (no courses enrolled)
  useEffect(() => {
    if (!loadingEnrolled && enrolledCourses) {
      if (enrolledCourses.length === 0) {
        setOpen(true);
      } else {
        setSelectedCourses(enrolledCourses.map((c) => c.id));
      }
    }
  }, [enrolledCourses, loadingEnrolled]);

  // Mutation to save courses
  const saveCoursesMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      const res = await fetch("/api/users/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds }),
      });
      if (!res.ok) throw new Error("Failed to save courses");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Courses updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // refresh dashboard books
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to save courses. Please try again.");
    },
  });

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSave = () => {
    if (selectedCourses.length === 0) {
      toast.warning("Please select at least one course.");
      return;
    }
    saveCoursesMutation.mutate(selectedCourses);
  };

  if (loadingCourses || loadingEnrolled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Registration</DialogTitle>
          <DialogDescription>
            Select the courses you are taking this semester. This personalizes your library and dashboards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableCourses?.length === 0 ? (
            <p className="text-sm text-gray-500">No courses found for your department.</p>
          ) : (
            <div className="grid gap-3">
              {availableCourses?.map((course: any) => (
                <div key={course.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                  <Checkbox
                    id={course.id}
                    checked={selectedCourses.includes(course.id)}
                    onCheckedChange={() => toggleCourse(course.id)}
                  />
                  <div className="grid gap-1.5 leading-none cursor-pointer flex-1" onClick={() => toggleCourse(course.id)}>
                    <Label htmlFor={course.id} className="font-semibold cursor-pointer">
                      {course.courseCode}
                    </Label>
                    <p className="text-xs text-muted-foreground">{course.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          {enrolledCourses && enrolledCourses.length > 0 && (
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saveCoursesMutation.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saveCoursesMutation.isPending ? "Saving..." : "Save Courses"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
