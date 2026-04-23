"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getRecentlyViewedBooks } from "@/lib/utils";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const ContinueReading = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const recentlyViewed = getRecentlyViewedBooks();
    setBooks(recentlyViewed);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  }, []);

  return (
    <div className="space-y-6 pt-3">
      <div className="flex items-center justify-between px-3">
        <h3 className="text-lg font-bold font-cabin text-zinc-900 dark:text-zinc-100 tracking-tight">
          Continue Reading
        </h3>
        <Button variant="ghost" size="sm" className="text-[12px] font-poppins font-normal text-blue-600 hover:text-blue-700 hover:bg-transparent">
          View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-col rounded-4xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                <Skeleton className="h-32 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-[80%]" />
                  <Skeleton className="h-3 w-[40%]" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          books.slice(0, 2).map((book) => (
            <Link key={book.id} href={`/book/${book.id}`} className="block">
              <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all group">
                {/* Banner Area */}
                <div className="relative h-32 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-zinc-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                      {book.title || "Untitled Document"}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-medium text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{book.updatedAt || "Last viewed 2h ago"}</span>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-zinc-500">Progress</span>
                      <span className="text-blue-600">45%</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-full shadow-sm">
              <BookOpen className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-500 max-w-[12rem]">No recent activity. Pick up where you left off!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinueReading;

