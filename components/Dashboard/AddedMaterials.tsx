import React from "react";
import { BooksRow } from "@/components/Dashboard/BooksRow";
import { TableSkeleton } from "@/components/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  return (
    <div className="px-2 flex-1">
      <div className="bg-white dark:bg-zinc-950 rounded-lg p-5 w-full mt-5 px-4 sm:px-8">
        <h3 className="font-open-sans font-semibold mb-6 sm:mb-10">
          Recently Added Materials
        </h3>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="tracking-wider uppercase text-zinc-400 dark:text-zinc-300 text-xs font-karla">
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books &&
                books
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 5)
                  .map((book) => <BooksRow key={book.id} book={book} />)}
              {loading && <TableSkeleton />}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
