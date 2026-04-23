"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { PlusIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import Link from "next/link";
import { UserCheckIcon, ArrowRightIcon, ShieldCheckIcon } from "lucide-react";
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

      {/* === Admin Tasks / Quick Links === */}
      <div className="px-2 mb-10 italic-none">
        <Link
          href="/dashboard/admin/verifications"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 bg-zinc-900 text-white rounded-[3rem] shadow-2xl shadow-zinc-900/10 hover:shadow-zinc-900/20 transition-all group overflow-hidden relative"
        >
          <div className="flex items-center gap-6 mb-4 sm:mb-0 relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 group-hover:rotate-6 transition-transform">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black font-cabin text-white text-xl uppercase tracking-tighter">Verification Queue</h3>
              <p className="font-poppins text-[11px] text-zinc-400 font-light max-w-md mt-1">Review student admission credentials to authorize core platform access.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-blue-400 font-cabin ml-auto sm:ml-0 group-hover:translate-x-2 transition-transform relative z-10">
            Open Portal <ArrowRightIcon className="w-4 h-4" />
          </div>
          <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-125 transition-transform">
            <ShieldCheckIcon className="w-32 h-32" />
          </div>
        </Link>
      </div>

      {/* === Main Content === */}
      <div className="w-full overflow-x-hidden italic-none">
        <div className="px-2 flex flex-col lg:flex-row gap-10">
          {/* FACULTY SECTION */}
          <div className="bg-white dark:bg-zinc-950 rounded-[3rem] p-10 w-full lg:w-1/2 border-none shadow-sm shadow-zinc-100 dark:shadow-none">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-cabin uppercase tracking-tighter">
                  Faculty
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium opacity-70 mt-1">Core academic subdivisions.</p>
              </div>
              <button
                className="flex gap-3 items-center font-black font-cabin cursor-pointer rounded-2xl px-5 py-3 text-[10px] uppercase tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all shadow-lg shadow-zinc-900/10 "
                onClick={() => {
                  setType("faculty");
                  setOpen(true);
                }}
              >
                <PlusIcon className="w-4 h-4" /> Add New
              </button>
            </div>

            <div className="w-full flex flex-col gap-2">
              {!facultiesLoading
                ? faculties?.map((faculty) => (
                  <FacultyRow
                    key={faculty.id}
                    facultyId={faculty.id}
                    name={faculty.name}
                  />
                ))
                : Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-50 dark:border-zinc-900">
              <button
                onClick={() => setFacultyPage((p) => Math.max(p - 1, 1))}
                disabled={facultyPage === 1}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                Prev
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Page {facultyPage}</span>
              <button
                onClick={() => setFacultyPage((p) => p + 1)}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* DEPARTMENT SECTION */}
          <div className="bg-white dark:bg-zinc-950 rounded-[3rem] p-10 w-full lg:w-1/2 border-none shadow-sm shadow-zinc-100 dark:shadow-none">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-cabin uppercase tracking-tighter">
                  Department
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium  opacity-70 mt-1">Specialized learning streams.</p>
              </div>
              <button
                className="flex gap-3 items-center font-black font-cabin cursor-pointer rounded-2xl px-5 py-3 text-[10px] uppercase tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all shadow-lg shadow-zinc-900/10 "
                onClick={() => {
                  setType("department");
                  setOpen(true);
                }}
              >
                <PlusIcon className="w-4 h-4" /> Add New
              </button>
            </div>

            <div className="w-full flex flex-col gap-2">
              {!departmentsLoading
                ? departments?.map((department) => (
                  <DepartmentRow
                    key={department.id}
                    departmentId={department.id}
                    name={department.name || department.departmentName || "Unknown"}
                  />
                ))
                : Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={3} />)}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-50 dark:border-zinc-900">
              <button
                onClick={() => setDepartmentPage((p) => Math.max(p - 1, 1))}
                disabled={departmentPage === 1}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                Prev
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Page {departmentPage}</span>
              <button
                onClick={() => setDepartmentPage((p) => p + 1)}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
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
