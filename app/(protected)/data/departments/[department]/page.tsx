"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Mail,
  Award,
  Building2,
} from "lucide-react";

import { getDepartmentWithFaculty } from "@/actions/department";
import { useDepartmentUsers } from "@/hooks/useUsers";
import { useUsers } from "@/hooks/useUsers";
import { User } from "@/types";

import DepartmentStudentsTable from "@/components/adminDashboard/DepartmentStudentsTable";
import DepartmentBooksTable from "@/components/adminDashboard/DepartmentBooksTable";
import CourseManagement from "@/components/adminDashboard/CourseManagement";

type TabId = "students" | "books" | "courses";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "students", label: "Students", icon: Users },
  { id: "books", label: "Library", icon: BookOpen },
  { id: "courses", label: "Courses", icon: GraduationCap },
];

const Page = () => {
  const params = useParams();
  const departmentId = params.department as string;

  const [activeTab, setActiveTab] = useState<TabId>("students");
  const [departmentInfo, setDepartmentInfo] = useState<{
    facultyName: string;
    departmentName: string;
    facultyId: string;
  } | null>(null);

  useEffect(() => {
    if (departmentId) {
      getDepartmentWithFaculty(departmentId).then(setDepartmentInfo);
    }
  }, [departmentId]);

  const { data: students = [] } = useDepartmentUsers(departmentId);
  const { data: facultyUsers = [] } = useUsers(departmentInfo?.facultyId);
  const facultyReps = (facultyUsers as User[]).filter((u) => u.role === "FACULTY REP");

  const deptAsType = departmentInfo
    ? {
        id: departmentId,
        departmentName: departmentInfo.departmentName,
        facultyId: departmentInfo.facultyId,
        facultyName: departmentInfo.facultyName,
      }
    : null;

  return (
    <div className="space-y-8 pb-20 font-poppins">
      {/* ── Hero header ─────────────────────────────────── */}
      <div className="bg-zinc-900 dark:bg-zinc-50 rounded-[3rem] px-10 py-12 text-white dark:text-zinc-900 shadow-2xl shadow-zinc-900/20 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 font-cabin">
            {departmentInfo?.facultyName ?? "Faculty"}
          </p>
          <h1 className="text-3xl md:text-4xl font-black font-cabin uppercase tracking-tighter mb-3">
            {departmentInfo?.departmentName ?? "Department"}
          </h1>
          <div className="flex flex-wrap gap-5 text-xs text-zinc-400 dark:text-zinc-500 font-poppins">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {(students as User[]).length} students
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 opacity-5">
          <Building2 className="w-60 h-60" />
        </div>
      </div>

      {/* ── Faculty Reps strip ────────────────────────── */}
      {facultyReps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyReps.map((rep: User) => (
            <div
              key={rep.id}
              className="bg-white dark:bg-zinc-950 rounded-[2rem] px-6 py-5 shadow-sm flex items-center gap-4 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-[2rem]" />
              {/* Avatar */}
              <div className="w-11 h-11 rounded-2xl shrink-0 overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black font-cabin text-base shadow-md">
                {rep.imageUrl ? (
                  <img src={rep.imageUrl} alt={rep.fullName} className="w-full h-full object-cover" />
                ) : (
                  rep.fullName?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 font-cabin truncate">
                    {rep.fullName}
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-cabin shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Rep
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                  <a
                    href={`mailto:${rep.email}`}
                    className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 truncate font-poppins"
                  >
                    {rep.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins">
                    <Award className="w-3 h-3" /> {rep.matricNo || "—"}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins">
                    <GraduationCap className="w-3 h-3" /> {rep.year}L
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-7 py-3.5 rounded-2xl whitespace-nowrap font-black font-cabin text-[10px] uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/15 scale-105"
                : "bg-white dark:bg-zinc-950 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 shadow-sm"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "students" && (
            <DepartmentStudentsTable students={students as User[]} />
          )}

          {activeTab === "books" && (
            <DepartmentBooksTable
              departmentId={departmentId}
              department={deptAsType}
            />
          )}

          {activeTab === "courses" && (
            <CourseManagement
              departmentId={departmentId}
              departmentInfo={deptAsType}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Page;
