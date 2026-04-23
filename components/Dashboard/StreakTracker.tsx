"use client";

import React from "react";
import { Flame, Zap, Check } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

export default function StreakTracker() {
  const { data: analytics, isLoading } = useAnalytics();
  const streak = analytics?.kpis?.streak || 0;
  const heatmap = analytics?.heatmap || [];

  const today = new Date();
  const startOfHighlightWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  // Generate the 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfHighlightWeek, i);
    const dateStr = format(date, "yyyy-MM-dd");

    // Check if user read on this day using heatmap data
    const hasRead = heatmap.some(h => h.date === dateStr && (h.value || 0) > 0);

    return {
      date,
      dayName: format(date, "EE").charAt(0), // M, T, W...
      dayNum: format(date, "d"),
      isToday: isSameDay(date, today),
      hasRead,
      isPast: date < today && !isSameDay(date, today),
    };
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-6 animate-pulse h-full">
        <div className="h-full w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-6 space-y-6 shadow-sm transition-all duration-300 hover:shadow-md h-full flex flex-col justify-center">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[20px] font-bold font-poppins text-zinc-900 dark:text-zinc-100 tracking-tight leading-none mb-1.5">
            Study Streak
          </h3>
          <p className="text-[13px] text-zinc-400 font-medium">
            {streak > 0 ? "You're on fire! Keep going." : "Start your streak today!"}
          </p>
        </div>
        <div className={cn(
          "px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-500",
          streak > 0
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500 shadow-sm shadow-amber-500/10"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
        )}>
          <Flame className={cn("w-4 h-4", streak > 0 ? "fill-amber-500" : "fill-zinc-400")} />
          <span className="text-sm font-bold">{streak} Days</span>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        {weekDays.map((day, i) => {
          const isCompleted = day.hasRead;
          const showCheck = isCompleted && !day.isToday;

          return (
            <div key={i} className="flex flex-col items-center gap-3">
              <span className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                day.isToday ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"
              )}>
                {day.dayName}
              </span>

              <div className="relative">
                {day.isToday ? (
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg",
                    day.hasRead
                      ? "bg-linear-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-600/30"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-700 shadow-none"
                  )}>
                    {day.hasRead ? <Zap className="w-5 h-5 fill-white" /> : <span className="text-[15px] font-bold">{day.dayNum}</span>}
                  </div>
                ) : (
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold transition-all duration-500",
                    isCompleted
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border border-emerald-100 dark:border-emerald-800/50"
                      : "text-zinc-300 dark:text-zinc-600"
                  )}>
                    {showCheck ? <Check className="w-5 h-5 stroke-[3px]" /> : day.dayNum}
                  </div>
                )}

                {/* Connector dots for visual continuity */}
                {i < 6 && (
                  <div className="absolute top-1/2 -right-4 w-2 h-0.5 bg-zinc-100 dark:bg-zinc-800 -translate-y-1/2" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
