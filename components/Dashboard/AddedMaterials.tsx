import React from "react";
import { BooksRow } from "@/components/Dashboard/BooksRow";
import { TableSkeleton } from "@/components/TableSkeleton";

export default function AddedMaterials({
  books,
  loading,
}: {
  books: any;
  loading: boolean;
}) {
  return (
    <div className="px-2 flex-1">
      <div className="bg-white dark:bg-zinc-950 rounded-lg p-5 w-full mt-5 px-4 sm:px-8">
        <h3 className="font-open-sans font-semibold mb-6 sm:mb-10">
          Recently Added Materials
        </h3>

        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse min-w-[600px]">
            <thead className="text-left">
              <tr className="tracking-wider uppercase text-zinc-400 dark:text-zinc-300 text-xs font-karla border-b border-zinc-200 dark:border-zinc-600">
                <th className="text-left py-3 px-2">Title</th>
                <th className="text-left px-2">Course</th>
                <th className="text-left px-2">Type</th>
                <th className="text-left px-2">Date</th>
                <th className="text-left px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books &&
                books
                  .sort(
                    (a: Book, b: Book) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 5)
                  .map((book: unknown, idx: React.Key | null | undefined) => (
                    <BooksRow key={idx} book={book} />
                  ))}
              {loading && <TableSkeleton />}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
