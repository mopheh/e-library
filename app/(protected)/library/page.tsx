"use client";

import React, { useEffect, useState } from "react";
import { useUserData } from "@/hooks/useUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { useBooks } from "@/hooks/useBooks";
import { addRecentlyViewedBook } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";
import { LibrarySidebar } from "@/components/library/LibrarySidebar";
import { LibrarySaaSCard } from "@/components/library/LibrarySaaSCard";
import { SmartLibraryHeader } from "@/components/library/SmartLibraryHeader";
import { PersonalizedSection } from "@/components/library/PersonalizedSection";
import { BookPreviewModal } from "@/components/library/BookPreviewModal";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { Ghost, MailPlus, Loader2 } from "lucide-react";

const BooksGridSkeleton = () => (
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1,2,3,4,5,6,7,8].map((i) => (
         <div key={i} className="flex flex-col gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="flex justify-between w-full">
               <Skeleton className="h-12 w-10 rounded" />
               <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4 mt-2" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full mt-2" />
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
               <Skeleton className="h-3 w-8" />
               <Skeleton className="h-3 w-8" />
            </div>
         </div>
      ))}
   </div>
);

const EmptyState = ({ onReset }: { onReset: () => void }) => (
   <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 bg-dashed-zinc dark:bg-dashed-zinc-dark rounded-3xl text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
      <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
         <Ghost className="w-10 h-10 text-zinc-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-2xl font-bold font-cabin text-zinc-900 dark:text-white mb-3">No matching resources</h3>
      <p className="text-xs font-poppins text-zinc-500 max-w-md mb-8">
         We couldn't find any resources matching your exact criteria. Try adjusting your filters or request this material.
      </p>
      <div className="flex items-center gap-4">
         <button 
            onClick={onReset}
            className="text-xs font-normal font-poppins text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 rounded-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
         >
            Clear all filters
         </button>
         <button className="text-xs font-normal font-poppins text-white bg-blue-600 px-6 py-2.5 rounded-xl shadow-sm hover:bg-blue-700 flex items-center gap-2 transition">
            <MailPlus className="w-4 h-4" /> Request Resource
         </button>
      </div>
   </div>
);

const Page = () => {
  const { data: user, isLoading: userLoading } = useUserData();
  const router = useRouter();

  const [department, setDepartment] = useState<string | undefined>();
  const [level, setLevel] = useState<string | undefined>();
  const [type, setType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    if (user && !department && !level) {
      setDepartment(user.departmentId);
      setLevel(user.level);
    }
  }, [user]);

  const { data: departments = [] } = useDepartments({ facultyId: user?.facultyId });
  const { data: booksData = { books: [], totalPages: 1 }, isLoading } = useBooks({
    departmentId: department,
    type: type === "All" ? "" : type,
    level,
    page: currentPage,
    pageSize,
    search: debouncedSearch,
  });

  const generatePageRange = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const range = [];
    if (current > 2) range.push(1);
    if (current > 3) range.push("...");

    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
       range.push(i);
    }

    if (current < total - 2) range.push("...");
    if (current < total) range.push(total);

    return range;
  };

  const pageRange = generatePageRange(currentPage, booksData.totalPages);

  const handleOpenReader = (bookId: string) => {
    setSelectedBook(null);
    router.push(`/book/${bookId}`);
  };

  const handleQuickFilter = (badge: string) => {
     if (badge === "My Department") {
        setDepartment(user?.departmentId || "");
        setType("All");
        setLevel("");
     }
  };

  if (userLoading || !user) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-zinc-500 text-xs font-poppins font-medium">Initializing workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-zinc-50/50 dark:bg-[#0a0a0c]">
      <SmartLibraryHeader 
         searchQuery={searchQuery} 
         setSearchQuery={setSearchQuery} 
         onFilterClick={handleQuickFilter}
      />

      <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
         <LibrarySidebar 
           department={department}
           setDepartment={setDepartment}
           level={level}
           setLevel={setLevel}
           type={type}
           setType={setType}
           departments={departments}
         />

         <div className="flex-1 min-w-0 flex flex-col">
            {!searchQuery && <PersonalizedSection />}

            {isLoading ? (
               <BooksGridSkeleton />
            ) : booksData.books.length === 0 ? (
               <EmptyState onReset={() => { setType("All"); setLevel(""); setSearchQuery(""); setDepartment(""); }} />
            ) : (
               <div className="space-y-10 pb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {booksData.books.map((book: any) => (
                      <LibrarySaaSCard key={book.id} book={book} onPreview={setSelectedBook} />
                    ))}
                  </div>

                  {booksData.totalPages > 1 && (
                    <div className="pt-6 w-full flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>

                          {pageRange.map((page, i) =>
                            typeof page === "number" ? (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={currentPage === page}
                                  onClick={() => setCurrentPage(page)}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={i}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage((p) => Math.min(p + 1, booksData.totalPages))}
                              className={currentPage === booksData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
               </div>
            )}
         </div>
      </div>

      <BookPreviewModal 
         isOpen={!!selectedBook}
         book={selectedBook}
         onClose={() => setSelectedBook(null)}
         onOpenReader={handleOpenReader}
      />
    </div>
  );
};

export default Page;
