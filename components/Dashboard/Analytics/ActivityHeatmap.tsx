"use client";

import React from "react";
import { format, eachDayOfInterval, subMonths, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ActivityHeatmapProps {
  data: { date: string; count: number; value: number }[];
  loading?: boolean;
}

const ActivityHeatmap = ({ data, loading }: ActivityHeatmapProps) => {
  // Show last 3 months
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  const days = eachDayOfInterval({ start: threeMonthsAgo, end: today });

  const getIntensity = (date: Date) => {
    const entry = data.find((d) => isSameDay(new Date(d.date), date));
    if (!entry || entry.value === 0) return "bg-zinc-100 dark:bg-zinc-800";
    if (entry.value < 15) return "bg-indigo-200 dark:bg-indigo-900/40"; 
    if (entry.value < 30) return "bg-indigo-400 dark:bg-indigo-700/40";
    if (entry.value < 60) return "bg-indigo-500 dark:bg-indigo-600/40";
    return "bg-indigo-600 dark:bg-indigo-500/40";
  };
  
  const getValue = (date: Date) => {
    const entry = data.find((d) => isSameDay(new Date(d.date), date));
    return entry ? `${entry.value} mins` : "No reading";
  }

  return (
    <Card className="border-none shadow-none bg-zinc-50 dark:bg-zinc-900/50 font-poppins">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Consistency Heatmap</CardTitle>
        <CardDescription className="text-xs">Daily reading streaks over the last 3 months</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="flex flex-wrap gap-1.5 justify-start">
                  {Array.from({ length: 90 }).map((_, i) => (
                      <Skeleton key={i} className="w-3 h-3 rounded-[2px]" />
                  ))}
             </div>
        ) : (
            <div className="flex flex-wrap gap-1.5 justify-start">
                {days.map((day, i) => (
                    <div 
                        key={i} 
                        className={cn(
                            "w-3 h-3 rounded-[2px] transition-all hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700",
                            getIntensity(day)
                        )}
                        title={`${format(day, "MMM d")}: ${getValue(day)}`}
                    />
                ))}
            </div>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
                <div className="w-3 h-3 rounded-[2px] bg-indigo-200 dark:bg-indigo-900/40" />
                <div className="w-3 h-3 rounded-[2px] bg-indigo-400 dark:bg-indigo-700/40" />
                <div className="w-3 h-3 rounded-[2px] bg-indigo-600 dark:bg-indigo-500/40" />
            </div>
            <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;
