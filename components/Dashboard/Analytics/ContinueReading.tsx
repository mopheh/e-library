import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getRecentlyViewedBooks } from "@/lib/utils";
import ViewedBook from "@/components/Dashboard/ViewedBook"; // Assuming this component exists and is compatible
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
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-open-sans font-semibold">Continue Reading</CardTitle>
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
                 {/* Reusing ViewedBook or creating a simplified view here */}
                 <div className="relative h-12 w-8 overflow-hidden rounded">
                    {/* Placeholder for book cover if ViewedBook expects specific props */}
                    <div className="h-full w-full bg-indigo-100 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-indigo-500" />
                    </div>
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate font-open-sans">{book.title || "Untitled Book"}</p>
                    <p className="text-xs text-muted-foreground truncate font-poppins">{book.course || "Unknown Course"}</p>
                 </div>
                 {/* <div className="text-xs font-medium text-muted-foreground">45%</div> */}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-muted/50 p-3 rounded-full mb-3">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground font-poppins">No recent books</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[12rem] font-poppins">
              Start reading properly to track your progress.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContinueReading;
