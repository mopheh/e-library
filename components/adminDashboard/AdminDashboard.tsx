"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlusIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import Link from "next/link";
import CountUp from "react-countup";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  BookOpen,
  Users,
  GraduationCap,
  BookMarked,
  Building2,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
} from "lucide-react";
import FormModal from "@/components/FormDialogBody";
import AddFacultyForm from "@/components/adminDashboard/department/AddFacultyForm";
import DepartmentRow from "@/components/adminDashboard/department/DepartmentRow";
import FacultyRow from "./faculty/FacultyRow";
import { useFaculties } from "@/hooks/useFaculties";
import { useDepartments } from "@/hooks/useDepartments";
import { SkeletonRow } from "@/components/adminDashboard/SkeletonRow";
import { useAdminStats } from "@/hooks/useAdminStats";
import CourseManagement from "@/components/adminDashboard/CourseManagement";

// ─── Stat card ────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
  accent: string;       // icon bg + text class
  gradient: string;     // card gradient
  suffix?: string;
}

function StatCard({ title, value, icon: Icon, loading, accent, gradient, suffix = "" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[2rem] p-7 shadow-sm ${gradient}`}
    >
      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />

      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1 opacity-60 font-cabin">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-20 bg-white/20 rounded-xl animate-pulse" />
          ) : (
            <p className="text-3xl font-black font-cabin tracking-tighter">
              {typeof value === "number" ? (
                <CountUp end={value} duration={1.8} separator="," />
              ) : (
                value
              )}
              {suffix && <span className="text-lg ml-0.5 opacity-70">{suffix}</span>}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────
const AdminDashboard = () => {
  const [facultyPage, setFacultyPage] = useState(1);
  const [deptPage, setDeptPage] = useState(1);
  const [deptSearch, setDeptSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "courses">("overview");

  const { data: faculties, isLoading: facultiesLoading, isError: facultiesError, error: facultiesErr } =
    useFaculties(facultyPage);
  const { data: departments, isLoading: deptLoading, isError: deptError, error: deptErr } =
    useDepartments({ page: deptPage, limit: 5, search: deptSearch });
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr } = useAdminStats();

  useEffect(() => {
    if (facultiesError) toast.error(facultiesErr?.message || "Failed to fetch faculties");
    if (deptError) toast.error(deptErr?.message || "Failed to fetch departments");
    if (statsError) toast.error(statsErr?.message || "Failed to fetch stats");
  }, [facultiesError, deptError, statsError, facultiesErr?.message, deptErr?.message, statsErr?.message]);

  // Server-side filter is used now, but we check if we have data to display
  const filteredDepts = departments ?? [];

  // Reset page to 1 when searching
  useEffect(() => {
    setDeptPage(1);
  }, [deptSearch]);

  const STAT_CARDS: StatCardProps[] = [
    {
      title: "Total Users",
      value: stats?.users ?? 0,
      icon: Users,
      loading: statsLoading,
      accent: "bg-white/20 text-white",
      gradient: "bg-gradient-to-br from-indigo-600 to-violet-700 text-white",
    },
    {
      title: "Courses",
      value: stats?.courses ?? 0,
      icon: GraduationCap,
      loading: statsLoading,
      accent: "bg-white/20 text-white",
      gradient: "bg-gradient-to-br from-blue-600 to-cyan-600 text-white",
    },
    {
      title: "Materials",
      value: stats?.materials ?? 0,
      icon: BookMarked,
      loading: statsLoading,
      accent: "bg-white/20 text-white",
      gradient: "bg-gradient-to-br from-emerald-600 to-teal-600 text-white",
    },
    {
      title: "Departments",
      value: stats?.departments ?? 0,
      icon: Building2,
      loading: statsLoading,
      accent: "bg-white/20 text-white",
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    },
    {
      title: "Faculties",
      value: stats?.faculties ?? 0,
      icon: BookOpen,
      loading: statsLoading,
      accent: "bg-white/20 text-white",
      gradient: "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
    },
    {
      title: "CBT Sessions",
      value: stats?.cbtUsage ?? 0,
      icon: BarChart3,
      loading: statsLoading,
      accent: "bg-white/20 text-white",
      gradient: "bg-gradient-to-br from-slate-700 to-zinc-800 text-white",
    },
    {
      title: "Reading Hours",
      value: Math.round((stats?.totalReadingMinutes ?? 0) / 60),
      icon: Clock,
      loading: statsLoading,
      accent: "bg-white/20 text-white",
      gradient: "bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white",
      suffix: "h",
    },
  ];

  return (
    <>
      {/* ── Section toggle ─────────────────────── */}
      <div className="flex gap-3 mb-8">
        {[
          { id: "overview", label: "Structure" },
          { id: "courses", label: "Courses", icon: GraduationCap },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black font-cabin text-[10px] uppercase tracking-widest transition-all ${activeSection === s.id
              ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10"
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
          >
            {s.icon && <s.icon className="w-3.5 h-3.5" />}
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === "courses" && <CourseManagement />}

      {activeSection === "overview" && (
        <>
          {/* ── Stats grid ─────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
            {STAT_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <StatCard {...card} />
              </motion.div>
            ))}
          </div>

          {/* ── Verification Queue CTA ──────────────── */}
          <div className="mb-10">
            <Link
              href="/dashboard/admin/verifications"
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl shadow-zinc-900/15 hover:shadow-zinc-900/25 transition-all group overflow-hidden relative"
            >
              <div className="flex items-center gap-6 mb-4 sm:mb-0 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 group-hover:rotate-6 transition-transform shrink-0">
                  <ShieldCheckIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black font-cabin text-white text-lg uppercase tracking-tighter">
                    Verification Queue
                  </h3>
                  <p className="font-poppins text-[11px] text-zinc-400 font-light max-w-md mt-0.5">
                    Review student admission credentials to authorize core platform access.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-blue-400 font-cabin group-hover:translate-x-2 transition-transform relative z-10 shrink-0">
                Open Portal <ArrowRightIcon className="w-4 h-4" />
              </div>
              <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 opacity-5 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-48 h-48" />
              </div>
            </Link>
          </div>

          {/* ── Faculty & Department tables ─────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* FACULTY TABLE */}
            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-zinc-50 dark:border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                      Faculties
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-poppins">Core academic subdivisions</p>
                  </div>
                </div>
                <button
                  onClick={() => { setType("faculty"); setOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Rows */}
              <div className="px-4 py-4 space-y-1 min-h-[280px]">
                {facultiesLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : (faculties ?? []).length === 0
                    ? (
                      <div className="flex flex-col items-center justify-center h-48 text-center">
                        <BookOpen className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mb-3" />
                        <p className="text-xs font-bold font-cabin text-zinc-400 uppercase tracking-wider">No faculties yet</p>
                      </div>
                    )
                    : (faculties ?? []).map((faculty) => (
                      <FacultyRow key={faculty.id} facultyId={faculty.id} name={faculty.name} />
                    ))
                }
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-8 py-5 border-t border-zinc-50 dark:border-zinc-900">
                <button
                  onClick={() => setFacultyPage((p) => Math.max(p - 1, 1))}
                  disabled={facultyPage === 1}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-[10px] font-bold font-cabin text-zinc-400 uppercase tracking-widest">
                  Page {facultyPage}
                </span>
                <button
                  onClick={() => setFacultyPage((p) => p + 1)}
                  disabled={(faculties ?? []).length < 5}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* DEPARTMENT TABLE */}
            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-8 pb-5 border-b border-zinc-50 dark:border-zinc-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                        Departments
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-poppins">Specialized learning streams</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setType("department"); setOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Department search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Filter departments…"
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-2 ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Rows */}
              <div className="px-4 py-4 space-y-1 min-h-[280px]">
                {deptLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={3} />)
                  : filteredDepts.length === 0
                    ? (
                      <div className="flex flex-col items-center justify-center h-48 text-center">
                        <Building2 className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mb-3" />
                        <p className="text-xs font-bold font-cabin text-zinc-400 uppercase tracking-wider">
                          {deptSearch ? "No match found" : "No departments yet"}
                        </p>
                      </div>
                    )
                    : filteredDepts.map((dept) => (
                      <DepartmentRow
                        key={dept.id}
                        departmentId={dept.id}
                        name={dept.name ?? dept.departmentName ?? "Unknown"}
                      />
                    ))
                }
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-8 py-5 border-t border-zinc-50 dark:border-zinc-900">
                <button
                  onClick={() => setDeptPage((p) => Math.max(p - 1, 1))}
                  disabled={deptPage === 1}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-[10px] font-bold font-cabin text-zinc-400 uppercase tracking-widest">
                  Page {deptPage}
                </span>
                <button
                  onClick={() => setDeptPage((p) => p + 1)}
                  disabled={filteredDepts.length < 5}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Shared modal */}
          <FormModal open={open} setOpen={setOpen}>
            <AddFacultyForm type={type} />
          </FormModal>
        </>
      )}
    </>
  );
};

export default AdminDashboard;
