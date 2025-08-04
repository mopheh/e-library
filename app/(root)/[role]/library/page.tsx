"use client"

import React, { useEffect, useState } from "react"
import { useUserData } from "@/hooks/useUsers"
import { useDepartments } from "@/hooks/useDepartments"
import { useBooks } from "@/hooks/useBooks"
import { BooksRow } from "@/components/Dashboard/BooksRow"
import { TableSkeleton } from "@/components/TableSkeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Card, CardContent, CardTitle } from "@/components/ui/card"

const Page = () => {
  const { data: user, isLoading: userLoading } = useUserData()

  const [department, setDepartment] = useState<string | undefined>()
  const [level, setLevel] = useState<string | undefined>()
  const [type, setType] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 12

  useEffect(() => {
    if (user && !department && !level) {
      setDepartment(user.departmentId)
      setLevel(user.level)
    }
  }, [user])

  const { data: departments } = useDepartments(user?.facultyId)
  const { data: books = { books: [], totalPages: 1 }, isLoading } = useBooks({
    departmentId: department,
    type,
    level,
    page: currentPage,
    pageSize,
  })

  const generatePageRange = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

    const range = []
    if (current > 2) range.push(1)
    if (current > 3) range.push("...")

    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      range.push(i)
    }

    if (current < total - 2) range.push("...")
    if (current < total) range.push(total)

    return range
  }

  const pageRange = generatePageRange(currentPage, books.totalPages)

  return (
    <div className="p-4 space-y-6">
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
            <p className="text-center text-muted-foreground">No books found.</p>
          ) : (
            <>
              {/* 📱 Mobile View – Card */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {books.books.map((book: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="space-y-2 py-4">
                      <CardTitle className="text-lg">{book.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {book.course?.name}
                      </p>
                      <p className="text-xs">{book.type}</p>
                      <p className="text-xs">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 💻 Desktop View – Table */}
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
  )
}

export default Page
