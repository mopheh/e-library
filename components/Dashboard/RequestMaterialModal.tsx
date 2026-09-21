"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import FormModal from "@/components/FormDialogBody";
import { useCourses } from "@/hooks/useCourses";
import { createResourceRequest } from "@/actions/resources";

export default function RequestMaterialModal({ departmentId }: { departmentId?: string }) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const router = useRouter();

  const { data: courses } = useCourses({ departmentId, limit: 500, includeBorrowed: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError(null);
    setDescriptionError(null);

    let hasError = false;
    if (!courseId) {
      setCourseError("Please select a course.");
      hasError = true;
    }
    if (description.trim().length < 10) {
      setDescriptionError("Please describe what you need in a bit more detail.");
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    const res = await createResourceRequest(courseId, description);
    if (res.success) {
      toast.success("Request submitted", {
        description: "Your faculty rep will be notified.",
      });
      setOpen(false);
      setCourseId("");
      setDescription("");
      router.refresh();
    } else {
      toast.error("Couldn't submit your request", {
        description: res.error || "Please try again.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold transition-colors flex items-center gap-2 shadow-sm"
      >
        <Plus className="w-5 h-5" /> Request Material
      </button>

      <FormModal open={open} setOpen={setOpen}>
        <div className="p-8 font-poppins">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Request Material</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Tell us what you&apos;re missing and your department&apos;s faculty rep will be notified.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Course</label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  if (courseError) setCourseError(null);
                }}
                className={`w-full bg-zinc-50 dark:bg-zinc-900 border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all ${
                  courseError
                    ? "border-red-400 dark:border-red-500 focus:ring-red-500/20"
                    : "border-zinc-200 dark:border-zinc-800 focus:ring-blue-500/20"
                }`}
                required
              >
                <option value="">Select a course</option>
                {courses?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.title}
                  </option>
                ))}
              </select>
              {courseError && <p className="text-xs text-red-500">{courseError}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">What do you need?</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionError) setDescriptionError(null);
                }}
                placeholder="e.g. Past questions for the 2024/2025 session, or the textbook by..."
                rows={4}
                className={`w-full bg-zinc-50 dark:bg-zinc-900 border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all ${
                  descriptionError
                    ? "border-red-400 dark:border-red-500 focus:ring-red-500/20"
                    : "border-zinc-200 dark:border-zinc-800 focus:ring-blue-500/20"
                }`}
                required
              />
              {descriptionError && <p className="text-xs text-red-500">{descriptionError}</p>}
            </div>

            <button
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </FormModal>
    </>
  );
}
