"use client";
import React, {useEffect} from "react";
import { useParams } from "next/navigation";
import PDFReader from "@/components/Dashboard/PDFReader";
import { useBook } from "@/hooks/useBooks";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading } = useBook(id);
    useEffect(() => {
        document.body.classList.add("overflow-hidden");
        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, []);
  if (isLoading || !book) {
    return (
        <div className="flex bg-white/80 h-screen w-full justify-center items-center animate-fade-in col-span-3">
          <img
              src="/univault.png"
              alt="Loading UniVault..."
              className="h-20 w-auto animate-pulse mb-4"
          />
        </div>
    );
  }

  return (
      <div className="md:px-4 py-2">
        <PDFReader fileUrl={(book as any).fileUrl} bookId={(book as any).id} />
      </div>
  );
};

export default Page;
