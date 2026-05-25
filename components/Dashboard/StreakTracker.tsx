"use client";

import React from "react";
import { Flame, Check, Zap } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

export default function StreakTracker() {
  const { data: analytics, isLoading } = useAnalytics();
  const streak = analytics?.kpis?.streak || 0;
  const heatmap = analytics?.heatmap || [];

  const today = new Date();
  const startOfHighlightWeek = startOfWeek(today, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfHighlightWeek, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const hasRead = heatmap.some((h: any) => h.date === dateStr && (h.value || 0) > 0);
    return {
      date,
      dayName: format(date, "EEEEE"), // M T W T F S S
      dayNum: format(date, "d"),
      isToday: isSameDay(date, today),
      hasRead,
      isPast: date < today && !isSameDay(date, today),
    };
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 h-full animate-pulse">
        <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 h-full flex flex-col justify-between shadow-sm hover:shadow-md transition-all border border-zinc-50 dark:border-zinc-800/60">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-1">
            Weekly Streak
          </p>
          <h3 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
            {streak > 0 ? "Keep it going! 🔥" : "Start today!"}
          </h3>
        </div>

        {/* Streak pill */}
        <div className={cn(
          "flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-sm font-black font-cabin transition-all",
          streak > 0
            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
        )}>
          <Flame className={cn("w-4 h-4", streak > 0 ? "fill-amber-500 text-amber-500" : "text-zinc-400")} />
          {streak}d
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-400 font-cabin uppercase tracking-widest">
            This week's progress
          </span>
          <span className="text-[10px] font-black text-zinc-500 font-cabin">
            {weekDays.filter((d) => d.hasRead).length}/7
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
            style={{ width: `${(weekDays.filter((d) => d.hasRead).length / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Day bubbles */}
      <div className="flex items-center justify-between gap-1">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider font-cabin",
              day.isToday ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"
            )}>
              {day.dayName}
            </span>

            {day.isToday ? (
              <div className={cn(
                "w-8 h-8 rounded-2xl flex items-center justify-center transition-all",
                day.hasRead
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  : "border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400"
              )}>
                {day.hasRead
                  ? <Zap className="w-4 h-4 fill-white text-white" />
                  : <span className="text-[11px] font-black font-cabin">{day.dayNum}</span>
                }
              </div>
            ) : (
              <div className={cn(
                "w-8 h-8 rounded-2xl flex items-center justify-center transition-all text-[11px] font-black font-cabin",
                day.hasRead
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                  : day.isPast
                  ? "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600"
                  : "text-zinc-300 dark:text-zinc-600"
              )}>
                {day.hasRead && !day.isToday
                  ? <Check className="w-3.5 h-3.5 stroke-[3]" />
                  : day.dayNum
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
