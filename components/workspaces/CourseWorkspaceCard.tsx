"use client";

import React from "react";
import { BookOpen, Zap, RotateCcw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { WorkspaceCourse } from "./types";

export const COURSE_GRADIENTS = [
  ["from-violet-500 to-indigo-600", "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300", "text-violet-600 dark:text-violet-400"],
  ["from-blue-500 to-cyan-600",     "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",     "text-cyan-600 dark:text-cyan-400"],
  ["from-rose-500 to-pink-600",     "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",     "text-rose-600 dark:text-rose-400"],
  ["from-amber-500 to-orange-500",  "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300", "text-amber-600 dark:text-amber-400"],
  ["from-emerald-500 to-teal-600",  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300", "text-emerald-600 dark:text-emerald-400"],
  ["from-indigo-500 to-violet-600", "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300", "text-indigo-600 dark:text-indigo-400"],
  ["from-sky-500 to-blue-600",      "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",         "text-sky-600 dark:text-sky-400"],
  ["from-fuchsia-500 to-purple-600","bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300","text-fuchsia-600 dark:text-fuchsia-400"],
];

export function getCourseGradient(code: string) {
  const idx = code.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % COURSE_GRADIENTS.length;
  return COURSE_GRADIENTS[idx];
}

interface CourseCardProps {
  course: WorkspaceCourse;
  isCarryover?: boolean;
  onClick: () => void;
}

export const CourseWorkspaceCard = ({ course, isCarryover, onClick }: CourseCardProps) => {
  const [gradient, badgeClass, accentText] = getCourseGradient(course.courseCode);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative w-full text-left rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/30 hover:border-blue-200 dark:hover:border-blue-800/60 transition-all duration-300"
    >
      {/* Top gradient accent strip */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      {/* Carryover badge */}
      {isCarryover && (
        <div className="absolute top-4 right-3 z-10 flex items-center gap-1 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
          <RotateCcw className="w-2.5 h-2.5" />
          CARRYOVER
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <BookOpen className="w-4 h-4 text-white" />
        </div>

        {/* Course code + meta */}
        <div>
          <p className={`text-[11px] font-bold font-mono tracking-widest uppercase ${accentText} mb-0.5`}>
            {course.courseCode}
          </p>
          <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug font-poppins">
            {course.title}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${badgeClass}`}>
            {course.semester.charAt(0)}SEM
          </span>
          <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            {course.level}L
          </span>
          <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />{course.unitLoad}u
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400 font-medium font-poppins">Open Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </motion.button>
  );
};
