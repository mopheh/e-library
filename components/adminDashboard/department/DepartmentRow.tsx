// FacultyRow.tsx
"use client";
import { useDepartmentUsers } from "@/hooks/useUsers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings2, ArrowRight } from "lucide-react";

const DepartmentRow = ({
  departmentId,
  name,
}: {
  departmentId: string;
  name: string;
}) => {
  // @ts-ignore
  const { data: users, isLoading, isError } = useDepartmentUsers(departmentId);

  return (
    <div className="group flex items-center justify-between p-4 mb-3 bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl transition-all duration-300 hover:shadow-md hover:border-blue-500/30 dark:hover:border-blue-500/30">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold font-cairo border border-zinc-200 dark:border-zinc-700/50 shadow-inner">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm font-poppins">{name}</h4>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 font-poppins">
            {isLoading ? "..." : isError ? "Unable to load" : `${users?.length ?? 0} Students enrolled`}
          </span>
        </div>
      </div>
      
      <div className="flex items-center">
        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-poppins text-zinc-700 dark:text-zinc-200 shadow-sm">
            <Link href={`/dashboard/data/departments/${departmentId}`}>
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </Button>
      </div>
    </div>
  );
};

export default DepartmentRow;
