// FacultyRow.tsx
"use client";
import { useDepartmentUsers } from "@/hooks/useUsers";
import Link from "next/link";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
    <TableRow className="group cursor-default hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3 font-cabin">{name}</TableCell>
      <TableCell className="text-center text-zinc-500 dark:text-zinc-400 font-poppins">
        {isLoading ? "..." : isError ? "-" : (users?.length ?? 0)}
      </TableCell>
      <TableCell className="text-right">
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-poppins font-normal text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <Link href={`/admin/data/departments/${departmentId}`}>
            Manage
            </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default DepartmentRow;
