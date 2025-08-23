"use client"
import React, { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import Welcome from "@/components/Welcome"
import Stat from "@/components/Dashboard/Stat"
import { PlusIcon } from "@heroicons/react/20/solid"
import FormModal from "@/components/FormDialogBody"
import AddFacultyForm from "@/components/adminDashboard/department/AddFacultyForm"
import { useFaculties } from "@/hooks/useFaculties"
import { useDepartments } from "@/hooks/useDepartments"
import DepartmentRow from "@/components/adminDashboard/department/DepartmentRow"
import FacultyRow from "./faculty/FacultyRow"
import MiniLoader from "../Loader"

const AdminDashboard = () => {
  const [facultyPage, setFacultyPage] = useState(1)
  const [departmentPage, setDepartmentPage] = useState(1)
  const { data: faculties } = useFaculties(facultyPage)
  const { data: departments } = useDepartments({
    page: departmentPage,
    limit: 5,
  })

  const { user, isSignedIn, isLoaded } = useUser()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState("")

  useEffect(() => {
    if (user) {
      console.log(user)
    }
  }, [isSignedIn])

  return (
    <>
      {open && (
        <div className="fixed inset-0 backdrop-blur-xs w-screen h-screen"></div>
      )}
      <div className="grid gap-2 sm:gap-6 my-10 grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <Welcome
              name={"Admin"}
              guide={" Manage all users, books and material in uniVault"}
          />
        </div>

        <Stat title={"Users"} stat={24} />
        <Stat title={"Total Material"} stat={10} />
        <Stat title={"CBT Usage"} stat={19} />
        <Stat title={"Total Revenue"} stat={0} />
      </div>
      {departments ? (
        <div className="w-full overflow-x-hidden">
          <div className="px-2 flex flex-col lg:flex-row gap-4">
            {/* Faculty Section */}
            <div className="bg-white dark:bg-gray-950 rounded-lg p-5 w-[95%] mx-auto md:mx-0 lg:w-[50%] mt-5 px-4">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-open-sans font-semibold dark:text-white">Faculty</h3>
                <button
                  className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-full px-3 py-2 text-xs border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-800"
                  onClick={() => {
                    setType("faculty")
                    setOpen(true)
                  }}
                >
                  <PlusIcon className="w-6 h-6" /> Add Faculty
                </button>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="table-auto min-w-[500px] border-collapse">
                  <thead className="text-left">
                    <tr className="tracking-wider uppercase text-gray-400 text-xs font-karla border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3">Name</th>
                      <th>Number of Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculties ? (
                      faculties.map((faculty) => (
                        <FacultyRow
                          key={faculty.id}
                          facultyId={faculty.id}
                          name={faculty.name}
                        />
                      ))
                    ) : (
                      <>
                        <MiniLoader />
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Faculty pagination */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() =>
                    setFacultyPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={facultyPage === 1}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {facultyPage}
                </span>
                <button
                  onClick={() => setFacultyPage((prev) => prev + 1)}
                  className="text-xs text-green-500 hover:underline"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Department Section */}
            <div className="bg-white dark:bg-gray-950 rounded-lg p-5 w-full lg:w-[50%] mt-5 px-4">
              <div className="flex justify-between items-center mb-10">
                <h3 className="font-open-sans font-semibold">Department</h3>
                <button
                  className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-full px-3 py-2 text-xs border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-800"
                  onClick={() => {
                    setType("department")
                    setOpen(true)
                  }}
                >
                  <PlusIcon className="w-6 h-6" /> Add Department
                </button>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="min-w-[500px] table-auto border-collapse">
                  <thead className="text-left">
                    <tr className="tracking-wider uppercase text-gray-400 text-xs font-karla border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3">Name</th>
                      <th>Number of Members</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments &&
                      departments.map((department) => (
                        <DepartmentRow
                          key={department.id}
                          departmentId={department.id}
                          name={department.name}
                        />
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Department pagination */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() =>
                    setDepartmentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={departmentPage === 1}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {departmentPage}
                </span>
                <button
                  onClick={() => setDepartmentPage((prev) => prev + 1)}
                  className="text-xs text-green-500 hover:underline"
                >
                  Next
                </button>
              </div>

              <FormModal open={open} setOpen={setOpen}>
                <AddFacultyForm type={type} />
              </FormModal>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex relative z-50 bg-white/80 dark:bg-gray-900/80 h-screen w-full justify-center items-center animate-fade-in col-span-3">
          <MiniLoader />
        </div>
      )}
    </>
  )
}

export default AdminDashboard
