import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Need to ensure Tooltip component exists
import { format, eachDayOfInterval, subMonths, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
    if (entry.value < 15) return "bg-indigo-200 dark:bg-indigo-900"; 
    if (entry.value < 30) return "bg-indigo-400 dark:bg-indigo-700";
    if (entry.value < 60) return "bg-indigo-500 dark:bg-indigo-600";
    return "bg-indigo-600 dark:bg-indigo-500";
  };
  
  const getValue = (date: Date) => {
    const entry = data.find((d) => isSameDay(new Date(d.date), date));
    console.log(entry)
    return entry ? `${entry.value} mins` : "No reading";
  }

  return (
    <Card className="border-none shadow-none bg-zinc-50 dark:bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="font-open-sans font-semibold">Consistency Heatmap</CardTitle>
        <CardDescription className="font-poppins text-xs">Daily reading streaks over the last 3 months</CardDescription>
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
        <div className="mt-4 flex items-center gap-2 text-xs font-poppins text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-zinc-100 dark:bg-zinc-800" />
                <div className="w-3 h-3 rounded-[2px] bg-indigo-200 dark:bg-indigo-900" />
                <div className="w-3 h-3 rounded-[2px] bg-indigo-400 dark:bg-indigo-700" />
                <div className="w-3 h-3 rounded-[2px] bg-indigo-600 dark:bg-indigo-500" />
            </div>
            <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;
