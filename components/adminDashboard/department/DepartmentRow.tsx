"use client";

import { motion } from "framer-motion";
import { useDepartmentUsers } from "@/hooks/useUsers";
import Link from "next/link";
import { ArrowRight, Users, BookOpen } from "lucide-react";

const DEPT_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-yellow-600",
  "from-cyan-500 to-sky-600",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return DEPT_COLORS[Math.abs(hash) % DEPT_COLORS.length];
}

const DepartmentRow = ({
  departmentId,
  name,
}: {
  departmentId: string;
  name: string;
}) => {
  const { data: users, isLoading, isError } = useDepartmentUsers(departmentId);
  const gradient = getGradient(name);

  const studentCount = isLoading
    ? null
    : isError
    ? null
    : (users?.length ?? 0);

  // Determine a fill % for the progress bar (capped at a nominal 200 students = full)
  const fillPct = studentCount === null ? 0 : Math.min(100, (studentCount / 200) * 100);

  return (
    <motion.div
      layout
      className="group relative flex items-center gap-4 px-5 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/60 transition-all duration-200 overflow-hidden"
    >
      {/* Subtle left accent bar that fills based on student count */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${gradient}`}
          initial={{ height: 0 }}
          animate={{ height: `${fillPct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black font-cabin text-sm shrink-0 shadow-md`}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Name & stats */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 font-cabin truncate">
          {name}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {isLoading ? (
            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins">
              <Users className="w-3 h-3" />
              {studentCount ?? "—"} students
            </span>
          )}
        </div>
      </div>

      {/* Manage link */}
      <Link
        href={`/data/departments/${departmentId}`}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest font-cabin text-zinc-600 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all shadow-sm shrink-0"
      >
        Manage
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </motion.div>
  );
};

export default DepartmentRow;
