"use client";
import React from "react";
import { useParams } from "next/navigation";
import PDFReader from "@/components/Dashboard/PDFReader";
import { useBook } from "@/hooks/useBooks";
import { Loader2, BookX } from "lucide-react";
import { Book } from "@/types";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading } = useBook(id) as { data: Book | undefined; isLoading: boolean };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  if (!book || !book.fileUrl) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-full">
          <BookX size={48} className="text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Book unavailable</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This book does not have a valid file attached.
          </p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-theme(spacing.4))] md:h-[calc(100vh-9rem)] w-full overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full overflow-hidden">
        <PDFReader fileUrl={book.fileUrl} bookId={book.id} />
      </div>
    </div>
  );
};

export default Page;
