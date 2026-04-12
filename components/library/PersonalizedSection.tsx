import React, { useEffect, useState } from "react";
import { getRecentBooks } from "@/actions/library";
import { formatBytes } from "@/lib/utils";
import { BookOpen, MoveRight, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { Book } from "@/types";

export const PersonalizedSection = () => {
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await getRecentBooks();
        setRecentBooks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (loading) {
     return (
        <div className="flex items-center gap-2 text-zinc-400 p-4 text-xs font-poppins">
           <Loader2 className="w-4 h-4 animate-spin" /> Fetching your reading history...
        </div>
     )
  }

  if (recentBooks.length === 0) return null;

  return (
    <div className="w-full mb-10 overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold font-cabin tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" /> Continue Reading
        </h2>
        <button className="text-xs font-poppins font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
          View all <MoveRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex w-max space-x-4 p-1">
          {recentBooks.map((book) => {
             // Fake a progress bar based on readCount or just random for demonstration of SaaS feel
             // As user said: "fake engagement metrics for now"
             const fakeProgress = Math.min(100, Math.floor((book.readCount * 15) || 5 + Math.random() * 30));
             
             return (
              <div
                key={book.id}
                onClick={() => router.push(`/student/book/${book.id}`)}
                className="group relative w-72 md:w-80 flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden shrink-0"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div 
                     className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                     style={{ width: `${fakeProgress}%` }}
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="h-16 w-12 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <BookOpen className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold font-cabin text-zinc-900 dark:text-white truncate mb-1 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <div className="flex items-center justify-between font-poppins text-xs text-zinc-500">
                      <span className="truncate max-w-[120px]">{book.course || book.type}</span>
                      <span className="font-medium text-blue-600 font-poppins">{fakeProgress}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 font-poppins pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex justify-between items-center w-full">
                  <span>Last opened: {book.lastReadAt ? new Date(book.lastReadAt).toLocaleDateString() : 'Recently'}</span>
                  <span>{book.fileSize ? formatBytes(book.fileSize) : 'PDF'}</span>
                </div>
              </div>
          )})}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
};
