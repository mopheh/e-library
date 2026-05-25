"use client";

import React from "react";
import { MessageSquareText, BookOpen, Clock, Target } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const actions = [
  {
    icon: MessageSquareText,
    label: "AI Chat",
    sublabel: "Ask anything",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-900/30",
    border: "border-violet-200 dark:border-violet-800/40",
    href: "/dashboard/ai",
  },
  {
    icon: BookOpen,
    label: "Library",
    sublabel: "Browse materials",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
    href: "/library",
  },
  {
    icon: Clock,
    label: "Timetable",
    sublabel: "View schedule",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800/40",
    href: "/dashboard/timetable",
  },
  {
    icon: Target,
    label: "Goals",
    sublabel: "Track targets",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    border: "border-rose-200 dark:border-rose-800/40",
    href: "/dashboard/goals",
  },
];

export default function QuickActions() {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-4 px-1">
        Quick Access
      </p>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link
              href={action.href}
              className={`flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border ${action.border} ${action.bg} hover:scale-[1.04] active:scale-95 transition-all duration-200 group`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm border ${action.border} group-hover:shadow-md transition-shadow`}>
                <action.icon className={`w-5 h-5 ${action.color}`} strokeWidth={2} />
              </div>
              <div className="text-center">
                <p className={`text-[11px] font-black font-cabin uppercase tracking-wider ${action.color}`}>
                  {action.label}
                </p>
                <p className="text-[9px] text-zinc-400 font-poppins hidden sm:block mt-0.5">
                  {action.sublabel}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
