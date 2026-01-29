"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { PlusIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import FormModal from "@/components/FormDialogBody";
import AddFacultyForm from "@/components/adminDashboard/department/AddFacultyForm";
import DepartmentRow from "@/components/adminDashboard/department/DepartmentRow";
import FacultyRow from "./faculty/FacultyRow";
import MiniLoader from "../Loader";
import Stat from "@/components/Dashboard/Stat";
import { useFaculties } from "@/hooks/useFaculties";
import { useDepartments } from "@/hooks/useDepartments";
import { useUsers } from "@/hooks/useUsers";
import { SkeletonRow } from "./SkeletonRow";

const AdminDashboard = () => {
  const [facultyPage, setFacultyPage] = useState(1);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");

  const { user, isSignedIn } = useUser();

  // Faculty Query
  const {
    data: faculties,
    isLoading: facultiesLoading,
    isError: facultiesError,
    error: facultiesErr,
  } = useFaculties(facultyPage);

  const {
    data: departments,
    isLoading: departmentsLoading,
    isError: departmentsError,
    error: departmentsErr,
  } = useDepartments({ page: departmentPage, limit: 5 });

  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErr,
  } = useUsers();

  // Log user on mount
  useEffect(() => {
    if (user) console.log(user);
  }, [isSignedIn]);

  // Show toast notifications for errors
  useEffect(() => {
    if (facultiesError)
      toast.error(facultiesErr?.message || "Failed to fetch faculties");
    if (departmentsError)
      toast.error(departmentsErr?.message || "Failed to fetch departments");
    if (usersError) toast.error(usersErr?.message || "Failed to fetch users");
  }, [facultiesError, departmentsError, usersError]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 backdrop-blur-xs w-screen h-screen"></div>
      )}

      {/* === Dashboard Stats === */}
      <div className="grid gap-2 sm:gap-6 my-10 grid-cols-2 lg:grid-cols-5">
        <Stat title="Users" stat={users?.length || 0} />
        <Stat title="Total Material" stat={10} />
        <Stat title="CBT Usage" stat={19} />
        <Stat title="Total Revenue" stat={0} />
      </div>

      {/* === Main Content === */}
      <div className="w-full overflow-x-hidden">
        <div className="px-2 flex flex-col lg:flex-row gap-4">
          {/* FACULTY SECTION */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-5 w-[95%] mx-auto md:mx-0 lg:w-[50%] mt-5 px-4">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-open-sans font-semibold dark:text-white">
                Faculty
              </h3>
              <button
                className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-full px-3 py-2 text-xs border border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-800"
                onClick={() => {
                  setType("faculty");
                  setOpen(true);
                }}
              >
                <PlusIcon className="w-6 h-6" /> Add Faculty
              </button>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="table-auto min-w-[500px] border-collapse">
                <thead className="text-left">
                  <tr className="tracking-wider uppercase text-zinc-400 text-xs font-karla border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-3">Name</th>
                    <th>Number of Members</th>
                  </tr>
                </thead>
                <tbody>
                  {!facultiesLoading
                    ? faculties?.map((faculty) => (
                        <FacultyRow
                          key={faculty.id}
                          facultyId={faculty.id}
                          name={faculty.name}
                        />
                      ))
                    : Array.from({ length: 6 }).map((_, i) => <SkeletonRow />)}
                </tbody>
              </table>
            </div>

            {/* Faculty pagination */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setFacultyPage((p) => Math.max(p - 1, 1))}
                disabled={facultyPage === 1}
                className="text-xs text-zinc-500 hover:underline"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-600">Page {facultyPage}</span>
              <button
                onClick={() => setFacultyPage((p) => p + 1)}
                className="text-xs text-green-500 hover:underline"
              >
                Next
              </button>
            </div>
          </div>

          {/* DEPARTMENT SECTION */}
          <div className="bg-white dark:bg-zinc-950 rounded-lg p-5 w-full lg:w-[50%] mt-5 px-4">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-open-sans font-semibold">Department</h3>
              <button
                className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-full px-3 py-2 text-xs border border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-800"
                onClick={() => {
                  setType("department");
                  setOpen(true);
                }}
              >
                <PlusIcon className="w-6 h-6" /> Add Department
              </button>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="min-w-[500px] table-auto border-collapse">
                <thead className="text-left">
                  <tr className="tracking-wider uppercase text-zinc-400 text-xs font-karla border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-3">Name</th>
                    <th>Number of Members</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!departmentsLoading
                    ? departments?.map((department) => (
                        <DepartmentRow
                          key={department.id}
                          departmentId={department.id}
                          name={department.name}
                        />
                      ))
                    : Array.from({ length: 6 }).map((_, i) => <SkeletonRow />)}
                </tbody>
              </table>
            </div>

            {/* Department pagination */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setDepartmentPage((p) => Math.max(p - 1, 1))}
                disabled={departmentPage === 1}
                className="text-xs text-zinc-500 hover:underline"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-600">
                Page {departmentPage}
              </span>
              <button
                onClick={() => setDepartmentPage((p) => p + 1)}
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
    </>
  );
};

export default AdminDashboard;
