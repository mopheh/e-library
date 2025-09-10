// FacultyRow.tsx
"use client";
import { useUsers } from "@/hooks/useUsers";

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
    <tr className="font-poppins text-xs py-3 text-zinc-800 border-b border-zinc-200 dark:border-zinc-900 dark:text-zinc-300 font-light">
      <td className="px-6 py-4">{name}</td>
      <td className="px-6 py-4">
        {isLoading ? "Loading..." : isError ? "Error" : (users?.length ?? 0)}
      </td>
    </tr>
  );
};

export default FacultyRow;
