"use client";
import React, { useEffect, useState } from "react";
import Courses from "@/components/adminDashboard/Courses";
import CustomList from "@/components/adminDashboard/CustomList";
import { useCourses } from "@/hooks/useCourses";
import { getDepartmentWithFaculty } from "@/actions/department";
import { useDepartmentUsers } from "@/hooks/useUsers";
import StudentRow from "@/components/adminDashboard/StudentRow";
import { useBooks } from "@/hooks/useBooks";
import { BooksRow } from "@/components/Dashboard/BooksRow";
import { useParams } from "next/navigation";

const Page = () => {
  const department = useParams().department as string;

  const { data: students } = useDepartmentUsers(department);
  const [coursePage, setCoursePage] = useState(1);
  const [bookPage, setBookPage] = useState(1);
  const [departmentInfo, setDepartmentInfo] = useState<{
    facultyName: string;
    departmentName: string;
  } | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const data = await getDepartmentWithFaculty(department);
      setDepartmentInfo(data);
    };

    if (department) fetchInfo();
  }, [department]);

  const { data: courses } = useCourses({
    departmentId: department,
    page: coursePage,
    limit: 5,
  });

  const {
    data: books = { books: [], totalPages: 1 },
    isLoading: booksLoading,
    error: booksError,
  } = useBooks({ departmentId: department, page: bookPage });

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row w-full gap-4">
          {/* Students Table */}
          <CustomList
            name={"Students"}
            courses={courses}
            department={[{ ...departmentInfo, id: department }]}
            students={students}
          >
            <div className="w-full overflow-x-auto">
              <table className="table-auto min-w-[500px] sm:min-w-full border-collapse">
                <thead className="text-left">
                  <tr className="tracking-wider uppercase font-normal text-zinc-400 text-xs font-karla border-b border-zinc-200">
                    <th className="py-3">Name</th>
                    <th>Matric Number</th>
                    <th>Level</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students &&
                    students.map((student: Credentials) => (
                      <StudentRow key={student.id} student={student} />
                    ))}
                </tbody>
              </table>
            </div>
          </CustomList>

          {/* Books Table */}
          <CustomList
            name={"Books"}
            courses={courses}
            department={[{ ...departmentInfo, id: department }]}
          >
            <div className="w-full overflow-x-auto">
              <table className="table-auto min-w-[500px] sm:min-w-full border-collapse">
                <thead className="text-left">
                  <tr className="tracking-wider uppercase font-normal text-zinc-400 text-xs font-karla border-b border-zinc-200">
                    <th className="py-3">Title</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books &&
                    books.books
                      .sort(
                        (a: Book, b: Book) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((book: Book, idx: React.Key | null | undefined) => (
                        <BooksRow key={idx} book={book} />
                      ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setBookPage((prev) => Math.max(prev - 1, 1))}
                disabled={bookPage === 1}
                className="text-xs text-zinc-500 hover:underline"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-600">Page {bookPage}</span>
              <button
                onClick={() => setBookPage((prev) => prev + 1)}
                className="text-xs text-green-500 hover:underline"
              >
                Next
              </button>
            </div>
          </CustomList>
        </div>

        {/* Courses Section */}
        <Courses
          department={[{ ...departmentInfo, id: department }]}
          id={department}
          courses={courses}
          page={coursePage}
          next={setCoursePage}
        />
      </div>
    </>
  );
};
export default Page;
