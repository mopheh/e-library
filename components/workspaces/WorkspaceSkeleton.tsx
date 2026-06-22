import React from "react";

export const WorkspaceSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden animate-pulse"
      >
        <div className="h-2 bg-zinc-200 dark:bg-zinc-800" />
        <div className="p-5 space-y-3">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mt-3" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-3/4" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/3" />
          <div className="h-px bg-zinc-100 dark:bg-zinc-800 mt-3" />
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);
