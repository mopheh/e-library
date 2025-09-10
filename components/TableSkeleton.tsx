import React from "react";
import { Skeleton } from "@/components/Skeleton";

export const TableSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr
          key={i}
          className="font-poppins text-xs py-3 text-zinc-800 font-normal border-b border-zinc-200 dark:border-zinc-700"
        >
          <td className="py-4">
            <Skeleton width="w-24" />
          </td>
          <td className="py-4">
            <Skeleton width="w-20" />
          </td>
          <td className="py-4">
            <Skeleton width="w-16" />
          </td>
          <td className="py-4">
            <Skeleton width="w-16" />
          </td>
          <td className="pt-2 flex gap-1.5">
            <Skeleton width="w-8" height="h-8" />
            <Skeleton width="w-8" height="h-8" />
          </td>
        </tr>
      ))}
    </>
  );
};
