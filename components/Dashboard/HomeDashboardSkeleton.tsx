"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function HomeDashboardSkeleton() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-background animate-pulse">
      {/* Search / Header Area Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* KPI Cards Skeleton Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Main Grid Layout Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        {/* Left Column (Charts & Activity) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 h-[400px]">
            <Skeleton className="h-5 w-48 mb-6" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </div>
          
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 h-[300px]">
             <Skeleton className="h-5 w-32 mb-6" />
             <div className="grid grid-cols-12 gap-2 h-[200px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-full rounded-sm opacity-50" />
                ))}
             </div>
          </div>
        </div>

        {/* Right Column (Goals & Sidebar) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-6 mt-6 lg:mt-0">
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 h-[200px]">
             <Skeleton className="h-5 w-24 mb-4" />
             <Skeleton className="h-2 w-full mb-2" />
             <Skeleton className="h-2 w-full mb-2" />
             <Skeleton className="h-2 w-3/4" />
          </div>
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 h-[200px]">
             <Skeleton className="h-5 w-32 mb-4" />
             <Skeleton className="h-10 w-full mb-2 rounded-md" />
             <Skeleton className="h-10 w-full mb-2 rounded-md" />
          </div>
        </div>
      </div>

      {/* Bottom Section (New Arrivals / Discussions) Skeleton */}
      <div className="mt-8 border-t pt-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="bg-white dark:bg-zinc-950 rounded-xl border p-4 space-y-4">
           {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[60%]" />
                      <Skeleton className="h-4 w-[40%]" />
                  </div>
                   <Skeleton className="h-8 w-20 rounded-md" />
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}
