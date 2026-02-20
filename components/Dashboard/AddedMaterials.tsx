import React from "react";
import { BooksRow } from "@/components/Dashboard/BooksRow";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, FolderOpen } from "lucide-react";

type Book = {
  id: string;
  title: string;
  course: string;
  fileUrl: string;
  type: string;
  createdAt: string;
};

export default function AddedMaterials({
  books,
  loading,
}: {
  books: Book[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="w-full">
         <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
             <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[60%]" />
                            <Skeleton className="h-4 w-[40%]" />
                        </div>
                         <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                ))}
            </div>
         </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full mb-4 ring-1 ring-inset ring-zinc-900/5">
                <FolderOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                No new materials for your level yet.
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                Check back later for new course materials and books added by your department.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/20">
              <TableRow className="hover:bg-transparent tracking-wider uppercase text-zinc-500 dark:text-zinc-400 text-[11px] font-medium font-karla">
                <TableHead className="py-3 px-4">Material Details</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {books
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((book) => <BooksRow key={book.id} book={book} />)}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
