"use client";

import React, { useState, useMemo } from "react";
import { useUserData } from "@/hooks/useUsers";
import { useEnrolledCourses } from "@/hooks/useEnrolledCourses";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Zap,
  Settings,
  Plus,
  Brain,
  Sparkles,
  BarChart2,
} from "lucide-react";
import { CourseRegistrationModal } from "@/components/Dashboard/CourseRegistration";
import { motion, AnimatePresence } from "framer-motion";

// Restructured subcomponents and helpers
import { WorkspaceSkeleton } from "@/components/workspaces/WorkspaceSkeleton";
import { CourseWorkspaceCard } from "@/components/workspaces/CourseWorkspaceCard";
import { EmptyState } from "@/components/workspaces/EmptyState";
import { SemesterTab } from "@/components/workspaces/SemesterTab";
import { SectionHeader } from "@/components/workspaces/SectionHeader";

export default function WorkspacesPage() {
  const { data: user, isLoading: userLoading } = useUserData();
  const { data: enrolledCourses = [], isLoading: coursesLoading } = useEnrolledCourses();
  const router = useRouter();

  const [activeSemester, setActiveSemester] = useState<"FIRST" | "SECOND">("FIRST");

  const userLevel = user?.year ?? user?.level;
  const userLevelNum = userLevel ? parseInt(userLevel, 10) : null;

  const currentLevelCourses = useMemo(
    () => (userLevel ? enrolledCourses.filter((c) => c.level === userLevel) : []),
    [enrolledCourses, userLevel]
  );

  const carryoverCourses = useMemo(
    () =>
      userLevelNum !== null
        ? enrolledCourses.filter((c) => parseInt(c.level, 10) < userLevelNum)
        : [],
    [enrolledCourses, userLevelNum]
  );

  const displayedCurrentLevel = useMemo(
    () => currentLevelCourses.filter((c) => c.semester === activeSemester),
    [currentLevelCourses, activeSemester]
  );

  const displayedCarryover = useMemo(
    () => carryoverCourses.filter((c) => c.semester === activeSemester),
    [carryoverCourses, activeSemester]
  );

  const firstSemCount = enrolledCourses.filter((c) => c.semester === "FIRST").length;
  const secondSemCount = enrolledCourses.filter((c) => c.semester === "SECOND").length;
  const totalUnits = displayedCurrentLevel.reduce((s, c) => s + (c.unitLoad ?? 0), 0);

  const isLoading = userLoading || coursesLoading;

  return (
    <div className="min-h-screen pb-28">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Accent top bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-violet-500 to-cyan-500 rounded-full mb-6 opacity-60" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white font-poppins">
                My Workspaces
              </h1>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
              Each course has a dedicated workspace — textbooks, materials, and past questions all connected with AI.
            </p>
          </div>

          {/* Stats + CTA */}
          {!isLoading && (
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              {/* Stat chips */}
              <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
                <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{userLevel ?? "—"}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-poppins">Level</p>
                </div>
              </div>
              <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
                <Layers className="w-3.5 h-3.5 text-violet-500" />
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{enrolledCourses.length}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-poppins">Courses</p>
                </div>
              </div>
              <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{totalUnits}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-poppins">Units</p>
                </div>
              </div>

              {/* Manage CTA */}
              <CourseRegistrationModal
                departmentId={user?.departmentId}
                trigger={
                  <button className="flex items-center gap-2 text-xs font-semibold font-poppins text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 px-3.5 py-2.5 rounded-xl shadow-sm transition-all duration-200 group">
                    <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
                    Manage Courses
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* ── AI Banner ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center gap-4 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-40 h-full bg-gradient-to-l from-blue-50/50 dark:from-blue-950/10 to-transparent pointer-events-none" />
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-poppins">AI-Powered Study Assistant</p>
          <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
            Open any workspace and your AI tutor has read every material — ask questions, get summaries, generate practice tests.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-1 flex-shrink-0 font-poppins">
          <Sparkles className="w-3 h-3" />
          RAG Active
        </div>
      </div>

      {/* ── Semester Tabs + Toolbar ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-1">
          <SemesterTab
            active={activeSemester === "FIRST"}
            label="1st Semester"
            count={firstSemCount}
            onClick={() => setActiveSemester("FIRST")}
          />
          <SemesterTab
            active={activeSemester === "SECOND"}
            label="2nd Semester"
            count={secondSemCount}
            onClick={() => setActiveSemester("SECOND")}
          />
        </div>

        {/* Units summary pill */}
        {!isLoading && (
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-poppins">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{totalUnits} unit{totalUnits !== 1 ? "s" : ""} this semester</span>
          </div>
        )}
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      {isLoading ? (
        <WorkspaceSkeleton />
      ) : enrolledCourses.length === 0 ? (
        // Never enrolled anything
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
              <BookOpen className="w-9 h-9 text-zinc-400" strokeWidth={1.5} />
            </div>
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 font-poppins">
            No Courses Registered
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
            You haven&apos;t enrolled in any courses yet. Register your courses to access their dedicated workspaces with all study materials.
          </p>
          <CourseRegistrationModal
            departmentId={user?.departmentId}
            trigger={
              <button className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 font-poppins">
                <Plus className="w-4 h-4" />
                Register My Courses
              </button>
            }
          />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSemester}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-10"
          >
            {/* ── Current Level Courses ── */}
            <section>
              <SectionHeader
                gradient="from-blue-500 to-violet-600"
                title={`${userLevel ?? "—"} Level — ${activeSemester === "FIRST" ? "First" : "Second"} Semester`}
                subtitle={`${displayedCurrentLevel.length} course${displayedCurrentLevel.length !== 1 ? "s" : ""} · ${displayedCurrentLevel.reduce((s, c) => s + (c.unitLoad ?? 0), 0)} units`}
              />

              {displayedCurrentLevel.length === 0 ? (
                <EmptyState
                  semester={activeSemester}
                  departmentId={user?.departmentId}
                  isCurrentLevel
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedCurrentLevel.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                    >
                      <CourseWorkspaceCard
                        course={course}
                        onClick={() => router.push(`/workspaces/${course.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Carryover Courses ── */}
            <section>
              <SectionHeader
                gradient="from-amber-500 to-orange-500"
                title="Carryover Courses"
                subtitle="Courses you're repeating from lower levels"
                badge={
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5 font-poppins">
                    Previous Levels
                  </span>
                }
              />

              {displayedCarryover.length === 0 ? (
                <div className="flex items-start gap-4 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-0.5 font-poppins">
                      No carryover courses for this semester
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-poppins">
                      If you&apos;re repeating courses from a lower level, use{" "}
                      <strong className="font-semibold text-zinc-650 dark:text-zinc-400">Manage Courses</strong>{" "}
                      to add them.
                    </p>
                  </div>
                  <CourseRegistrationModal
                    departmentId={user?.departmentId}
                    trigger={
                      <button className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 px-3 py-1.5 rounded-lg transition-colors font-poppins">
                        <Plus className="w-3 h-3" />
                        Add Carryovers
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedCarryover.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                    >
                      <CourseWorkspaceCard
                        course={course}
                        isCarryover
                        onClick={() => router.push(`/workspaces/${course.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
