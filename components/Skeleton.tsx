import React from "react";
export const Skeleton = ({ width = "w-full", height = "h-4" }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${width} ${height}`}></div>
);
