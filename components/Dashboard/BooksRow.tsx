"use client";
import React from "react";
import { DownloadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { addRecentlyViewedBook } from "@/lib/utils";

export const downloadFile = async (
  url: string,
  id: string,
  filename: string
) => {
  let downloadUrl = url;

  if (url.includes("backblazeb2.com")) {
    const authResponse = await fetch(`/api/books/${id}/download`);
    if (!authResponse.ok) {
      throw new Error("Failed to get authenticated download URL");
    }
    const data = await authResponse.json();
    downloadUrl = data.url;
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error("Failed to download file");
  }
  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(blobUrl); // cleanup
};
// @ts-ignore
export const BooksRow = ({ book }) => {
  const router = useRouter();

  return (
    <tr className="font-poppins text-xs py-3 text-gray-800 dark:text-slate-100 font-normal border-b border-gray-200 dark:border-gray-800">
      <td
        className="py-4 cursor-pointer"
        onClick={() => {
          router.push(`/student/book/${book.id}`);
          addRecentlyViewedBook({ ...book, progress: 0 });
        }}
      >
        {book.title}
      </td>
      <td>{book.course}</td>
      <td>{book.type}</td>
      <td>
        {new Date(book.createdAt).toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </td>
      <td className="flex pt-2 gap-1.5">
        <div
          onClick={() =>
            downloadFile(book.fileUrl, book.id, `${book.title}.pdf`)
          }
          className="p-2 cursor-pointer bg-neutral-700 text-white rounded"
        >
          <DownloadIcon className="h-4 w-4" />
        </div>
      </td>
    </tr>
  );
};
