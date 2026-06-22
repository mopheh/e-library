import React from "react";

interface SemesterTabProps {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}

export const SemesterTab = ({
  active,
  label,
  count,
  onClick,
}: SemesterTabProps) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-poppins transition-all duration-200 ${
      active
        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md shadow-black/5 dark:shadow-black/30 border border-zinc-200 dark:border-zinc-700"
        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-900/60"
    }`}
  >
    {label}
    <span
      className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
      }`}
    >
      {count}
    </span>
  </button>
);
