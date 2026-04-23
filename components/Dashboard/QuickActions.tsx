"use client";

import React from "react";
import { MessageSquareText, Book, Clock, Target } from "lucide-react";
import Link from "next/link";

const actions = [
  { icon: MessageSquareText, label: "AI Chat", color: "text-[#8b5cf6]", bgColor: "bg-[#8b5cf6]/10 dark:bg-[#8b5cf6]/20", href: "/dashboard/ai" },
  { icon: Book, label: "E-Library", color: "text-[#10b981]", bgColor: "bg-[#10b981]/10 dark:bg-[#10b981]/20", href: "/library" },
  { icon: Clock, label: "Timetable", color: "text-[#f59e0b]", bgColor: "bg-[#f59e0b]/10 dark:bg-[#f59e0b]/20", href: "/dashboard/timetable" },
  { icon: Target, label: "Goals", color: "text-[#f43f5e]", bgColor: "bg-[#f43f5e]/10 dark:bg-[#f43f5e]/20", href: "/dashboard/goals" },
];

export default function QuickActions() {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold font-poppins text-zinc-900 dark:text-zinc-100 px-4 tracking-tight">
        Quick Actions
      </h3>
      <div className="grid grid-cols-4 gap-3 px-4">
        {actions.map((action, i) => (
          <Link 
            key={i} 
            href={action.href}
            className="group flex flex-col items-center gap-3 transition-all active:scale-95"
          >
            <div className={`w-[72px] h-[72px] rounded-[24px] flex items-center justify-center ${action.bgColor} ${action.color} transition-all`}>
              <action.icon className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 text-center font-poppins">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
