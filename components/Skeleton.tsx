import React from "react";
export const Skeleton = ({ width = "w-full", height = "h-4" }) => (
  <div
    className={`animate-pulse bg-zinc-300 dark:bg-zinc-800 rounded ${width} ${height}`}
  ></div>
);
