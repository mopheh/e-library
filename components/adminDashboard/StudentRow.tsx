"use client";
import React from "react";
import Link from "next/link";
import { TrashIcon } from "@heroicons/react/24/outline";
import { EditIcon } from "lucide-react";
import { User } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const StudentRow = ({ student }: { student: User }) => {
  return (
    <tr className="font-poppins text-xs py-3 text-zinc-800 dark:text-zinc-200 font-normal border-b border-zinc-200 dark:border-zinc-800">
      <td className="py-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={student.imageUrl || undefined} alt={student.fullName} />
            <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {student.fullName?.split(" ").map((n) => n[0]).join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <span>{student.fullName}</span>
        </div>
      </td>
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
