import React from "react";
import { Briefcase, Award, TerminalSquare, Building2, Globe } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";

export const getIcon = (opType: string) => {
  switch (opType) {
    case "INTERNSHIP":  return <Briefcase      className="w-5 h-5 text-blue-500" />;
    case "SCHOLARSHIP": return <Award          className="w-5 h-5 text-amber-500" />;
    case "HACKATHON":   return <TerminalSquare className="w-5 h-5 text-purple-500" />;
    case "JOB":         return <Building2      className="w-5 h-5 text-emerald-500" />;
    default:            return <Globe          className="w-5 h-5 text-gray-500" />;
  }
};

export const getBadgeColor = (opType: string) => {
  switch (opType) {
    case "INTERNSHIP":  return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "SCHOLARSHIP": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "HACKATHON":   return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
    case "JOB":         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    default:            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

/** Convert ISO timestamp → YYYY-MM-DD for input[type=date] */
export const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export interface DeadlineUrgency {
  label: string;
  className: string;
  daysLeft: number;
}

/** Only surfaces a badge when the deadline is worth calling attention to. */
export const getDeadlineUrgency = (deadline: string | null): DeadlineUrgency | null => {
  if (!deadline) return null;
  const daysLeft = differenceInCalendarDays(new Date(deadline), new Date());

  if (daysLeft < 0) return { label: "Closed", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", daysLeft };
  if (daysLeft === 0) return { label: "Closes today", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", daysLeft };
  if (daysLeft <= 3) return { label: `Closes in ${daysLeft}d`, className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", daysLeft };
  if (daysLeft <= 7) return { label: `Closes in ${daysLeft}d`, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", daysLeft };
  return null;
};
