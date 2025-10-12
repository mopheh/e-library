"use client";
import React, { JSX } from "react";
import { useRouter } from "next/navigation";
import { addRecentlyViewedBook, downloadFile } from "@/lib/utils";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { FaBookOpen, FaFileAlt, FaGraduationCap } from "react-icons/fa";
import { IoBookSharp } from "react-icons/io5";
import { MdOutlineNoteAlt, MdOutlineQuiz } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";

type Book = {
  id: string;
  title: string;
  course: string;
  type: string;
  fileUrl: string;
  createdAt: string;
};

export const BooksRow = ({ book }: { book: Book }) => {
  const router = useRouter();

  // 🎨 dynamic badge color per book type
  const badgeColors: Record<string, string> = {
    material: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    textbook:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    note: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    research:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    "past question":
      "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  };

  // 📘 choose an icon per type
  const iconMap: Record<string, JSX.Element> = {
    material: <FaFileAlt className="h-4 w-4 text-blue-500" />,
    textbook: <IoBookSharp className="h-4 w-4 text-emerald-500" />,
    note: <MdOutlineNoteAlt className="h-4 w-4 text-purple-500" />,
    research: <FaGraduationCap className="h-4 w-4 text-amber-500" />,
    "past question": <MdOutlineQuiz className="h-4 w-4 text-rose-500" />,
  };

  const bookType = book.type.toLowerCase();

  return (
    <TableRow className="text-xs font-poppins hover:bg-muted/50 transition-colors">
      {/* Title with icon */}
      <TableCell
        className="font-normal cursor-pointer flex items-center gap-2"
        onClick={() => {
          router.push(`/student/book/${book.id}`);
          addRecentlyViewedBook({ ...book, progress: 0 });
        }}
      >
        {iconMap[bookType] || <FaBookOpen className="h-4 w-4 text-zinc-500" />}
        <span className="truncate">{book.title}</span>
      </TableCell>

      {/* Course */}
      <TableCell className="capitalize text-zinc-700 dark:text-zinc-300">
        {book.course}
      </TableCell>

      {/* Type badge */}
      <TableCell>
        <Badge
          className={`capitalize border-none ${
            badgeColors[bookType] ||
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          {book.type}
        </Badge>
      </TableCell>

      {/* Date */}
      <TableCell className="text-zinc-500">
        {new Date(book.createdAt).toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <BsThreeDotsVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                router.push(`/student/book/${book.id}`);
                addRecentlyViewedBook({ ...book, progress: 0 });
              }}
            >
              <FaBookOpen className="h-4 w-4 mr-2" /> Read
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                downloadFile(book.fileUrl, book.id, `${book.title}.pdf`)
              }
            >
              <FiDownload className="h-4 w-4 mr-2" /> Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
