import React from "react"
import { BooksRow } from "@/components/Dashboard/BooksRow"
import { TableSkeleton } from "@/components/TableSkeleton"

export default function AddedMaterials({
  books,
  loading,
}: {
  books: any
  loading: boolean
}) {
  return (
    <div className="px-2">
      <div className="bg-white rounded-lg p-5 w-full mt-5 px-8">
        <h3 className="font-open-sans font-semibold mb-10">
          Recently Added Materials
        </h3>
        <table className="table-auto w-full border-collapse">
          <thead className="text-left">
            <tr className="tracking-wider !text-left uppercase text-gray-400 text-xs font-karla border-b border-gray-200">
              <th className="!text-left py-3">Title</th>
              <th className="!text-left">Course</th>
              <th className="!text-left">Type</th>
              <th className="!text-left">Date</th>
              <th className="!text-left">Actions</th>
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
  )
}
