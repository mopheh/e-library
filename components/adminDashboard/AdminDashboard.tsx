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
import { SkeletonRow } from "@/components/adminDashboard/SkeletonRow";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useUsers } from "@/hooks/useUsers";
// ... imports

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

    const {
        data: stats,
        isLoading: statsLoading,
        isError: statsError,
        error: statsErr,
    } = useAdminStats();

    // ... existing queries

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
    if (statsError)
        toast.error(statsErr?.message || "Failed to fetch dashboard stats");
  }, [facultiesError, departmentsError, statsError]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 backdrop-blur-xs w-screen h-screen"></div>
      )}

      {/* === Dashboard Stats === */}
      <div className="grid gap-2 sm:gap-6 my-10 grid-cols-2 lg:grid-cols-4">
        <Stat title="Total Users" stat={stats?.users || 0} loading={statsLoading} />
        <Stat
          title="Total Courses"
          stat={stats?.courses || 0}
          loading={statsLoading}
        />
        <Stat
          title="Material"
          stat={stats?.materials || 0}
          loading={statsLoading}
        />
        {/* <Stat title="Revenue" stat={stats?.revenue || 0} loading={statsLoading} /> */}
        <Stat
          title="Departments"
          stat={stats?.departments || 0}
          loading={statsLoading}
        />
      </div>

      {/* === Main Content === */}
      <div className="w-full overflow-x-hidden">
        <div className="px-2 flex flex-col lg:flex-row gap-4">
            {/* FACULTY SECTION */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 w-full lg:w-1/2 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Faculty
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage faculties and their members</p>
              </div>
              <button
                className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-lg px-3 py-2 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                onClick={() => {
                  setType("faculty");
                  setOpen(true);
                }}
              >
                <PlusIcon className="w-4 h-4" /> Add 
              </button>
            </div>

            <div className="w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium text-right">Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {!facultiesLoading
                    ? faculties?.map((faculty) => (
                        <FacultyRow
                          key={faculty.id}
                          facultyId={faculty.id}
                          name={faculty.name}
                        />
                      ))
                    : Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
             <div className="flex items-center justify-between mt-4">
                <button
                    onClick={() => setFacultyPage((p) => Math.max(p - 1, 1))}
                    disabled={facultyPage === 1}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-xs text-zinc-500">Page {facultyPage}</span>
                <button
                    onClick={() => setFacultyPage((p) => p + 1)}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
                >
                    Next
                </button>
            </div>
          </div>

          {/* DEPARTMENT SECTION */}
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 w-full lg:w-1/2 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Departments
                    </h3>
                     <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage departments and courses</p>
                </div>
              <button
                className="flex gap-2 items-center font-medium font-poppins cursor-pointer rounded-lg px-3 py-2 text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                onClick={() => {
                  setType("department");
                  setOpen(true);
                }}
              >
                <PlusIcon className="w-4 h-4" /> Add
              </button>
            </div>

             <div className="w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium text-center">Members</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {!departmentsLoading
                    ? departments?.map((department) => (
                        <DepartmentRow
                          key={department.id}
                          departmentId={department.id}
                          name={department.name}
                        />
                      ))
                    : Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={3} />)}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
             <div className="flex items-center justify-between mt-4">
                <button
                    onClick={() => setDepartmentPage((p) => Math.max(p - 1, 1))}
                    disabled={departmentPage === 1}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-xs text-zinc-500">Page {departmentPage}</span>
                <button
                    onClick={() => setDepartmentPage((p) => p + 1)}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
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
