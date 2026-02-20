"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import PDFReader from "@/components/Dashboard/PDFReader";
import { useBook } from "@/hooks/useBooks";
import { Loader2 } from "lucide-react";

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const { data: book, isLoading } = useBook(id);

  if (isLoading || !book) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-theme(spacing.4))] md:h-[calc(100vh-9rem)] w-full overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full overflow-hidden">
        <PDFReader fileUrl={(book as any).fileUrl} bookId={(book as any).id} />
      </div>
    </div>
  );
};

export default Page;
