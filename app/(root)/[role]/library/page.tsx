"use client";

import React, { useEffect, useState } from "react";
import { useUserData } from "@/hooks/useUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { useBooks } from "@/hooks/useBooks";
import { BooksRow } from "@/components/Dashboard/BooksRow";
import { TableSkeleton } from "@/components/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AiOutlineFilePdf } from "react-icons/ai";
import { HiOutlineDownload } from "react-icons/hi";
import { addRecentlyViewedBook, downloadFile } from "@/lib/utils";
import { useRouter } from "next/navigation";

const Page = () => {
  const { data: user, isLoading: userLoading } = useUserData();
  const router = useRouter();

  const [department, setDepartment] = useState<string | undefined>();
  const [level, setLevel] = useState<string | undefined>();
  const [type, setType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 12;

  useEffect(() => {
    if (user && !department && !level) {
      setDepartment(user.departmentId);
      setLevel(user.level);
    }
  }, [user]);

  const { data: departments } = useDepartments({ facultyId: user?.facultyId });
  const { data: books = { books: [], totalPages: 1 }, isLoading } = useBooks({
    departmentId: department,
    type,
    level,
    page: currentPage,
    pageSize,
  });

  const generatePageRange = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const range = [];
    if (current > 2) range.push(1);
    if (current > 3) range.push("...");

    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      range.push(i);
    }

    if (current < total - 2) range.push("...");
    if (current < total) range.push(total);

    return range;
  };

  const pageRange = generatePageRange(currentPage, books.totalPages);
  function formatBytes(bytes: number) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  const [sizes, setSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    books.books.forEach(async (book: any) => {
      if (book.fileUrl) {
        try {
          if (book.fileUrl.includes("backblazeb2.com")) {
            const authResponse = await fetch(`/api/books/${book.id}/download`);
            const data = await authResponse.json();
            const url = data.url;
            const res = await fetch(url, { method: "HEAD" });
            const length = res.headers.get("content-length");
            if (length)
              setSizes((prev) => ({
                ...prev,
                [book.id]: formatBytes(+length),
              }));
          } else {
            const res = await fetch(book.fileUrl, { method: "HEAD" });
            const length = res.headers.get("content-length");
            if (length)
              setSizes((prev) => ({
                ...prev,
                [book.id]: formatBytes(+length),
              }));
          }
        } catch (err) {
          console.error("Failed to fetch file size for", book.title, err);
        }
      }
    });
  }, [books]);
  return (
    <div className="p-4 space-y-6 bg-white dark:bg-zinc-950 rounded-2xl dark:text-white">
      {userLoading || !user ? (
        <div className="flex justify-center items-center h-screen">
          <img
            src="/univault.png"
            alt="Loading..."
            className="h-20 animate-pulse"
          />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-cabin">
            <Select
              value={department}
              onValueChange={(val) => setDepartment(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={(val) => setLevel(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {[100, 200, 300, 400, 500].map((lvl) => (
                  <SelectItem key={lvl} value={String(lvl)}>
                    {lvl} Level
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={(val) => setType(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Text Book">Textbook</SelectItem>
                <SelectItem value="Handout">Handout</SelectItem>
                <SelectItem value="Past Question">Past Question</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Book Results */}
          {books.books.length === 0 && !isLoading ? (
            <p className="text-center text-muted-foreground font-poppins font-light">
              No books found.
            </p>
          ) : (
            <>
              <div className="grid  sm:hidden grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 font-poppins">
                {books.books.map((book: any) => (
                  <Card
                    key={book.id}
                    className="relative p-4 hover:shadow-lg transition-shadow duration-200 dark:bg-zinc-900 dark:border-zinc-700 border border-zinc-200 rounded-xl"
                  >
                    {/* <div className="absolute -top-4 -left-4 w-fit h-fit rounded-full bg-zinc-950">
                      <div className="  text-red-500 w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                        <AiOutlineFilePdf className="text-2xl" />
                      </div>
                    </div> */}

                    <div className=" sm:ml-10 font-light">
                      <div className="flex justify-between items-start">
                        <h3
                          className="text-sm my-1 font-josefin-sans uppercase sm:text-lg font-normal leading-none dark:text-white"
                          onClick={() => {
                            router.push(`/student/book/${book.id}`);
                            addRecentlyViewedBook({ ...book, progress: 0 });
                          }}
                        >
                          {book.title}
                        </h3>
                        <button
                          className="text-zinc-500 dark:bg-zinc-950 p-3 rounded-full dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                          onClick={() =>
                            downloadFile(
                              book.fileUrl,
                              book.id,
                              `${book.title}.pdf`
                            )
                          }
                        >
                          <HiOutlineDownload className="text-xl" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-200">
                        {book.course?.name}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-200">
                        {book.type}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-200">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </p>
                      {sizes[book.id] && (
                        <p className="text-sm font-medium mt-2 dark:text-white">
                          {sizes[book.id]}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.books.map((book: any, idx: number) => (
                      <BooksRow key={idx} book={book} />
                    ))}
                    {isLoading && <TableSkeleton />}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {pageRange.map((page, i) =>
                      typeof page === "number" ? (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
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
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(p + 1, books.totalPages)
                          )
                        }
                        className={
                          currentPage === books.totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Page;
