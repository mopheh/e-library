"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourses } from "@/hooks/useCourses";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type EnrolledCourse = {
  id: string;
  courseCode: string;
};

export function CourseRegistrationModal({ departmentId, trigger }: { departmentId?: string, trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch ALL available courses (no department filter)
  const { data: allCourses, isLoading: loadingCourses } = useCourses({
    limit: 1000, 
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

  // Group courses
  const { myDepartmentCourses, otherCourses } = useMemo(() => {
    if (!allCourses) return { myDepartmentCourses: [], otherCourses: [] };
    
    // Filter by search query if any
    const filtered = allCourses.filter(c => 
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!departmentId) {
      return { myDepartmentCourses: filtered, otherCourses: [] };
    }

    return {
      myDepartmentCourses: filtered.filter((c: any) => c.departmentId === departmentId),
      otherCourses: filtered.filter((c: any) => c.departmentId !== departmentId),
    };
  }, [allCourses, departmentId, searchQuery]);

  if (loadingCourses || loadingEnrolled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild onClick={() => setOpen(true)}>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Registration</DialogTitle>
          <DialogDescription>
            Select your courses. You can choose courses from your department and shared/general courses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by course code or title..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="my-department" className="w-full">
            {departmentId && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-department">My Department</TabsTrigger>
                <TabsTrigger value="other-departments">General / Shared Courses</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="my-department" className="mt-4">
              <div className="h-[40vh] overflow-y-auto pr-2">
                {myDepartmentCourses.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {searchQuery ? "No matching courses found." : "No courses found for your department."}
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {myDepartmentCourses.map((course: any) => (
                      <div key={course.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
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
            </TabsContent>

            {departmentId && (
              <TabsContent value="other-departments" className="mt-4">
                <div className="h-[40vh] overflow-y-auto pr-2">
                  {otherCourses.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      {searchQuery ? "No matching shared courses found." : "No shared courses available."}
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {otherCourses.map((course: any) => (
                        <div key={course.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
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
              </TabsContent>
            )}
          </Tabs>

        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedCourses.length} course{selectedCourses.length !== 1 && 's'} selected
          </span>
          <div className="flex gap-3">
            {enrolledCourses && enrolledCourses.length > 0 && (
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
