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
import { Book, Credentials } from "@/types";
import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, GraduationCap, Award, ShieldCheck } from "lucide-react";

const Page = () => {
  const params = useParams();
  const department = params.department as string;
  const role = params.role as string;
  const isFacultyRep = role === "faculty-rep" || role === "FACULTY REP" || role === "faculty rep";

  const { data: students } = useDepartmentUsers(department);
  const [coursePage, setCoursePage] = useState(1);
  const [bookPage, setBookPage] = useState(1);
  const [departmentInfo, setDepartmentInfo] = useState<{
    facultyName: string;
    departmentName: string;
    facultyId: string;
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

  const { data: facultyUsers } = useUsers(departmentInfo?.facultyId);
  const facultyReps = (facultyUsers || []).filter((u: any) => u.role === "FACULTY REP" || u.role === "faculty-rep");

  return (
    <>
      <div className="space-y-4">
         {/* Faculty Representatives Mini Profiles */}
        {!isFacultyRep && facultyReps.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-poppins">
              {facultyReps.map((rep: any) => (
                 <Card key={rep.id} className="border-slate-100 dark:border-slate-900/50 bg-slate-50/50 dark:bg-slate-950/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500 rounded-l-xl"></div>
                    <CardContent className="p-4 flex items-start gap-4">
                       <div className="h-12 w-12 rounded-full bg-white font-cabin dark:bg-zinc-900 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-lg shrink-0 shadow-sm overflow-hidden">
                          {rep.imageUrl ? (
                             <img src={rep.imageUrl} alt={rep.fullName} className="h-full w-full object-cover" />
                          ) : (
                             rep.fullName?.charAt(0).toUpperCase()
                          )}
                       </div>
                       <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                             <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm md:text-base font-open-sans">{rep.fullName}</h3>
                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300 whitespace-nowrap border border-slate-200 dark:border-slate-800">
                                <ShieldCheck className="w-3 h-3" />
                                {rep.unsafeMetadata?.repType || "Faculty Rep"}
                             </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                             <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 truncate">
                                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                                <a href={`mailto:${rep.email}`} className="hover:text-slate-600 dark:hover:text-slate-400 truncate hover:underline">{rep.email}</a>
                             </div>
                             <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 truncate">
                                <Award className="w-3.5 h-3.5 text-zinc-400" />
                                {rep.matricNo || "N/A"}
                             </div>
                             <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 truncate sm:col-span-2">
                                <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="truncate">Level {rep.year} • {departmentInfo?.departmentName}</span>
                             </div>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
              ))}
           </div>
        )}

        <div className="flex flex-col lg:flex-row w-full gap-4">
          {/* Students Table */}
          {!isFacultyRep && (
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
          )}

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
        {!isFacultyRep && (
          <Courses
            department={[{ ...departmentInfo, id: department }]}
            id={department}
            courses={courses}
            page={coursePage}
            next={setCoursePage}
          />
        )}
      </div>
    </>
  );
};
export default Page;
