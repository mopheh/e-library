"use client";

import React from "react";
import { Zap } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function StreakTracker() {
  const { data: analytics } = useAnalytics();
  const streak = analytics?.streak || 0;
  const weeklyTrends = analytics?.weeklyTrends || [];
  
  const today = new Date();
  const startOfHighlightWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  // Generate the 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfHighlightWeek, i);
    const trend = weeklyTrends.find((t: any) => isSameDay(new Date(t.date), date));
    return {
      date,
      dayName: format(date, "EE").charAt(0), // M, T, W...
      dayNum: format(date, "d"),
      hasActivity: trend ? trend.minutes > 0 : false,
      isToday: isSameDay(date, today),
    };
  });

  return (
    <div className="glass-card p-6 rounded-[2rem] space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold font-poppins text-zinc-800 dark:text-zinc-200">
            Study Streak
          </h3>
          <p className="text-sm text-zinc-500 font-medium">Keep it up! you are on fire</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full flex items-center gap-2">
           <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
           <span className="text-sm font-bold text-amber-600">{streak} Days</span>
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {day.dayName}
            </span>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                day.isToday
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-110"
                  : day.hasActivity
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                  : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800"
              }`}
            >
              {day.dayNum}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
