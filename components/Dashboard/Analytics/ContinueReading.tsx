"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getRecentlyViewedBooks } from "@/lib/utils";
import { ArrowRight, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ContinueReading = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const recentlyViewed = getRecentlyViewedBooks();
    setBooks(recentlyViewed);
    // Simulate slight loading to match dashboard feel
    setTimeout(() => {
        setIsLoading(false);
    }, 400);
  }, []);

  return (
    <Card className="h-fit font-poppins border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold">Continue Reading</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
          View All <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <Skeleton className="h-12 w-8 rounded" />
                  <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-3 w-[50%]" />
                  </div>
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="space-y-4">
            {books.slice(0, 3).map((book) => (
              <div key={book.id} className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                 <div className="relative h-12 w-8 overflow-hidden rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-indigo-500" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-200">{book.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground truncate">Recently Viewed</p>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="bg-muted/50 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium text-muted-foreground max-w-[12rem]">No recent books found. Start reading to see them here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContinueReading;
