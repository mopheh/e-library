"usw client";
import React from "react";
import Link from "next/link";
import { TrashIcon } from "@heroicons/react/24/outline";
import { EditIcon } from "lucide-react";
import { Credentials } from "@/types";

const StudentRow = ({ student }: { student: Credentials }) => {
  return (
    <tr className="font-poppins text-xs py-3 text-zinc-800 dark:text-zinc-200 font-normal border-b border-zinc-200 dark:border-zinc-800">
      <td className=" py-4">{student.fullName}</td>
      <td className=" py-4">{student.matricNo}</td>
      <td className="py-4">{student.year}</td>
      <td className=" py-4">{student.role}</td>
      <td className="flex pt-2 gap-1.5">
        <div className="p-2 cursor-pointer border border-red-500 text-red-500 rounded">
          <TrashIcon className="h-4 w-4" />
        </div>
        <div className="p-2 cursor-pointer border border-zinc-600 bg-zinc-600 text-white rounded">
          <EditIcon className="h-4 w-4" />
        </div>
      </td>
    </tr>
  );
};
export default StudentRow;
