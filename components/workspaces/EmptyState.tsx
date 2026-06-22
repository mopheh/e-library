import React from "react";
import { BookMarked, Plus } from "lucide-react";
import { CourseRegistrationModal } from "@/components/Dashboard/CourseRegistration";

interface EmptyStateProps {
  semester: string;
  departmentId?: string;
  isCurrentLevel: boolean;
}

export const EmptyState = ({
  semester,
  departmentId,
  isCurrentLevel,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 bg-white dark:bg-zinc-900/10">
    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-4">
      <BookMarked className="w-7 h-7 text-zinc-400" strokeWidth={1.5} />
    </div>
    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 font-poppins">
      No {semester.charAt(0) + semester.slice(1).toLowerCase()} Semester Courses
    </h3>
    <p className="text-xs text-zinc-500 max-w-xs leading-relaxed mb-5 font-poppins">
      {isCurrentLevel
        ? `You haven't registered any courses for ${semester.toLowerCase()} semester yet.`
        : "No carryover courses from this semester."}
    </p>
    <CourseRegistrationModal
      departmentId={departmentId}
      trigger={
        <button className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/60 px-4 py-2.5 rounded-xl transition-colors font-poppins">
          <Plus className="w-3.5 h-3.5" />
          Register Courses
        </button>
      }
    />
  </div>
);
