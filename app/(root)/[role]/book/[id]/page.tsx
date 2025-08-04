"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRecentlyViewedBooks } from "@/lib/utils";
import PDFReader from "@/components/Dashboard/PDFReader";

const Page = () => {
  const { id } = useParams();
  // @ts-ignore
  const [book, setBook] = useState<Book>({});
  useEffect(() => {
    const books = getRecentlyViewedBooks();
    const book = books.find((book: Book) => id === book.id);
    setBook(book);
    console.log(book);
  }, []);
  return (
    <div className="px-4 py-2">
      {!book.id ? (
        <div className="flex bg-white/80 h-screen w-full justify-center items-center animate-fade-in col-span-3">
          <img
            src="/univault.png"
            alt="Loading UniVault..."
            className="h-20 w-auto animate-pulse mb-4"
          />
        </div>
      ) : (
        <PDFReader fileUrl={book.fileUrl} bookId={book.id} />
      )}
    </div>
  );
};
export default Page;
