"use client"
import React, { useEffect, useState } from "react"
import Nav from "@/components/Dashboard/Nav"
import Welcome from "@/components/Welcome"
import Stat from "@/components/Dashboard/Stat"
import { PlusIcon } from "@heroicons/react/20/solid"
import { useCourses } from "@/hooks/useCourses"
import FormModal from "@/components/FormDialogBody"
import AddCoursesForm from "@/components/AddCourses"
import { TrashIcon } from "@heroicons/react/24/outline"
import { EditIcon } from "lucide-react"
import { getDepartmentWithFaculty } from "@/actions/department"

interface CoursesProps {
  department: Department[] | null
  courses: Course[] | undefined
  id: string
  page: number
  next: React.Dispatch<React.SetStateAction<number>>
}

const Courses: React.FC<CoursesProps> = ({
  department,
  courses,
  id,
  page,
  next,
}) => {
  const [open, setOpen] = useState(false)
  console.log(courses)
  return (
    <div>
      {open && (
        <div className="fixed inset-0 backdrop-blur-xs w-screen h-screen"></div>
      )}

      {/* Courses Table */}
      <div className={`gap-4 bg-white dark:bg-gray-950 px-8 py-5 rounded-md ${open && 'no-scrollbar'}`}>
        <div className="flex justify-between items-center mb-10">
          <h3 className="font-open-sans font-semibold ">List of Courses</h3>
          <button
            className="flex gap-2 items-center font-medium font-poppins text-white cursor-pointer rounded-full px-3 py-2 text-xs border border-gray-700 bg-gray-600"
            onClick={() => setOpen(true)}
          >
            <PlusIcon className="w-6 h-6" /> Add Course
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="table-auto min-w-[500px] md:min-w-full border-collapse">
            <thead className="text-left">
              <tr className="tracking-wider uppercase text-gray-400 text-xs font-karla border-b border-gray-200">
                <th className="py-3">Course Code</th>
                <th>Title</th>
                <th>Unit Load</th>
                <th>Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses?.map((course) => (
                <tr
                  key={course.id}
                  className="font-poppins text-xs py-3 text-gray-800 dark:text-gray-200 font-normal border-b border-gray-200 dark:border-gray-800"
                >
                  <td className="px-6 py-4 uppercase">{course.courseCode}</td>
                  <td>{course.title}</td>
                  <td>{course.unitLoad}</td>
                  <td className="py-4 text-green-500 font-medium">
                    {course.level}
                  </td>
                  <td className="flex pt-2 gap-1.5">
                    <div className="p-2 cursor-pointer bg-red-500 text-white rounded">
                      <TrashIcon className="h-4 w-4" />
                    </div>
                    <div className="p-2 cursor-pointer bg-gray-500 text-white rounded">
                      <EditIcon className="h-4 w-4" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <button
            onClick={() => next(page - 1)}
            disabled={page === 1}
            className="text-xs text-gray-500 hover:underline"
          >
            Previous
          </button>
          <span className="text-xs text-gray-600">Page {page}</span>
          <button
            onClick={() => next(page + 1)}
            className="text-xs text-green-500 hover:underline"
          >
            Next
          </button>
        </div>

        <FormModal open={open} setOpen={setOpen}>
          {department && (
            <AddCoursesForm department={department} departmentId={id} />
          )}
        </FormModal>
      </div>
    </div>
  )
}

export default Courses
