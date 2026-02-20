// FacultyRow.tsx
"use client";
import { useUsers } from "@/hooks/useUsers";

import { TableRow, TableCell } from "@/components/ui/table";

const FacultyRow = ({
  facultyId,
  name,
}: {
  facultyId: string;
  name: string;
}) => {
  // @ts-ignore
  const { data: users, isLoading, isError } = useUsers(facultyId);

  return (
    <TableRow className="group cursor-default hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3">{name}</TableCell>
      <TableCell className="text-right text-zinc-500 dark:text-zinc-400">
        {isLoading ? "..." : isError ? "-" : (users?.length ?? 0)}
      </TableCell>
    </TableRow>
  );
};

export default FacultyRow;
