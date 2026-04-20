import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonRow = ({ columns = 2 }: { columns?: number }) => {
  return (
    <div className="flex items-center justify-between p-4 mb-3 bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl">
      <div className="flex items-center gap-4 w-1/2">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex flex-col gap-2 w-full">
           <Skeleton className="h-4 w-3/4" />
           <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex items-center justify-end w-1/3">
         <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
};
