// FacultyRow.tsx
"use client";
import { useDepartmentUsers } from "@/hooks/useUsers";
import Link from "next/link";

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
    <tr className="font-poppins text-xs py-3 text-zinc-800 border-b border-zinc-200 dark:border-zinc-900 font-light dark:text-zinc-200">
      <td className="px-6 py-4">{name}</td>
      <td className="px-6 py-4">
        {isLoading ? "Loading..." : isError ? "Error" : (users?.length ?? 0)}
      </td>
      <td className="py-4 text-green-500 cursor-pointer font-medium">
        <Link href={`/admin/data/departments/${departmentId}`}>
          View Details
        </Link>
      </td>
    </tr>
  );
};

export default DepartmentRow;
