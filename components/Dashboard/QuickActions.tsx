"use client";

import React from "react";
import { MessageSquare, BookOpen, Calendar, Target } from "lucide-react";
import Link from "next/link";

const actions = [
  { icon: MessageSquare, label: "AI Chat", color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30", href: "/dashboard/ai" },
  { icon: BookOpen, label: "E-Library", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30", href: "/library" },
  { icon: Calendar, label: "Timetable", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30", href: "/dashboard/timetable" },
  { icon: Target, label: "Goals", color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30", href: "/dashboard/goals" },
];

export default function QuickActions() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-poppins text-zinc-800 dark:text-zinc-200">
        Quick Actions
      </h3>
      <div className="grid grid-cols-4 gap-4">
        {actions.map((action, i) => (
          <Link 
            key={i} 
            href={action.href}
            className="group flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] flex items-center justify-center ${action.color} transition-all group-hover:scale-110 group-hover:shadow-lg`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
