"use client";

import React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, GraduationCap, Info, NotebookPen, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan, useUpdatePlanSettings } from "@/hooks/usePlan";
import { useGrades } from "@/hooks/useGrades";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useUserData } from "@/hooks/useUsers";
import { formatMinutes, useLogStudySheet } from "@/components/study-log/LogStudySheet";
import { CourseReadinessCard } from "@/components/progress/Readiness";
import { CLASS_TONE } from "@/components/grades/CgpaSummary";
import Charts from "@/components/Dashboard/Charts";
import MobileReadingChart from "@/components/Dashboard/MobileReadingChart";
import ActivityHeatmap from "@/components/Dashboard/Analytics/ActivityHeatmap";
import GoalsCard from "@/components/Dashboard/Analytics/GoalsCard";
import AIInsights from "@/components/Dashboard/Analytics/AIInsights";

const card = "rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm";
const BUDGETS = [4, 6, 8, 10, 12, 15, 20, 25, 30]; // hours per week

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">{children}</h2>
      {action}
    </div>
  );
}

function PlanSummary() {
  const { data: plan } = usePlan();
  const update = useUpdatePlanSettings();
  if (!plan) return null;

  const onTrack = plan.courses.filter((c) => c.band === "ON_TRACK").length;
  const pct = plan.planned ? Math.min(100, Math.round((plan.done / plan.planned) * 100)) : 0;
  const save = (patch: Parameters<typeof update.mutate>[0]) =>
    update.mutate(patch, { onError: (e) => toast.error(e.message) });

  return (
    <div className={cn(card, "p-5 sm:p-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-center")}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">
            {formatMinutes(plan.done)} <span className="text-lg text-zinc-400">/ {formatMinutes(plan.planned || 0)}</span>
          </p>
          <p className="text-sm text-zinc-500">
            studied this week · {plan.daysLeftInWeek} day{plan.daysLeftInWeek === 1 ? "" : "s"} left
          </p>
        </div>
        <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-zinc-500">
          {plan.courses.length
            ? `${onTrack} of ${plan.courses.length} course${plan.courses.length === 1 ? "" : "s"} on track. Time is shared out by unit load, how soon each exam is, and your CBT scores.`
            : "Register this semester's courses to get a plan."}
        </p>
      </div>

      <div className="flex flex-wrap md:flex-col gap-3 md:items-end">
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <Settings2 className="w-3.5 h-3.5" /> Weekly goal
          <select
            value={Math.round(plan.weeklyMinutes / 60)}
            onChange={(e) => save({ weeklyMinutes: Number(e.target.value) * 60 })}
            disabled={update.isPending}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {(BUDGETS.includes(Math.round(plan.weeklyMinutes / 60)) ? BUDGETS : [...BUDGETS, Math.round(plan.weeklyMinutes / 60)].sort((a, b) => a - b))
              .map((h) => <option key={h} value={h}>{h} hours</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          Semester
          <select
            value={plan.semesterChosen ? plan.semester : "AUTO"}
            onChange={(e) => save({ planSemester: e.target.value === "AUTO" ? null : (e.target.value as "FIRST" | "SECOND") })}
            disabled={update.isPending}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            <option value="AUTO">Auto ({plan.semesterChosen ? "…" : plan.semester === "FIRST" ? "First" : "Second"})</option>
            <option value="FIRST">First</option>
            <option value="SECOND">Second</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function GradesSnapshot() {
  const { data } = useGrades();
  const cgpa = data?.summary.cgpa;
  const cls = data?.summary.degreeClass;
  return (
    <Link href="/dashboard/grades" className={cn(card, "p-5 flex items-center gap-4 hover:shadow-md transition group")}>
      <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5" />
      </div>
      {cgpa != null && cls ? (
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">CGPA</p>
          <p className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-black font-cabin", CLASS_TONE[cls.key].text)}>{cgpa.toFixed(2)}</span>
            <span className="text-xs text-zinc-500 truncate">{cls.label}</span>
          </p>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Track your CGPA</p>
          <p className="text-xs text-zinc-500">Enter your current CGPA to see what you need this semester.</p>
        </div>
      )}
      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition" />
    </Link>
  );
}

export default function ProgressPage() {
  const { data: me } = useUserData();
  const isAspirant = me?.role === "ASPIRANT";
  const { data: plan, isLoading, isError } = usePlan(!isAspirant);
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { openLogStudy } = useLogStudySheet();

  return (
    <div className="flex-1 p-4 sm:p-5 md:p-8 pt-3 space-y-7 min-h-screen font-poppins bg-zinc-50/50 dark:bg-zinc-950">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">This semester</p>
          <h1 className="text-2xl md:text-3xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Progress</h1>
          <p className="text-sm text-zinc-500 mt-1">Your weekly plan, how ready you are for each exam, and your grades.</p>
        </div>
        <Link href="/dashboard/study-log" className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <NotebookPen className="w-4 h-4" /> Study log
        </Link>
      </div>

      {!isAspirant && (
        <>
          <section className="space-y-3">
            <SectionTitle>This week&apos;s plan</SectionTitle>
            {isError ? (
              <p className="text-sm text-rose-600">Couldn&apos;t load your plan. Please refresh.</p>
            ) : isLoading ? (
              <div className="h-36 rounded-[22px] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            ) : (
              <PlanSummary />
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle
              action={<span className="flex items-center gap-1 text-[10px] text-zinc-400"><Info className="w-3 h-3" /> Readiness = study time + CBT scores + materials</span>}
            >
              Exam readiness by course
            </SectionTitle>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-72 rounded-[22px] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}
              </div>
            ) : plan && plan.courses.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {plan.courses.map((c) => (
                  <CourseReadinessCard key={c.courseId} course={c} onLog={() => openLogStudy(c.courseId)} />
                ))}
              </div>
            ) : (
              <p className={cn(card, "p-5 text-sm text-zinc-500")}>
                No registered courses for this semester yet. Register them from your dashboard, or switch the semester above.
              </p>
            )}
          </section>

          <section className="grid md:grid-cols-2 gap-3">
            <GradesSnapshot />
            <Link href="/dashboard/study-log" className={cn(card, "p-5 flex items-center gap-4 hover:shadow-md transition group")}>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                <NotebookPen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Study log</p>
                <p className="text-xs text-zinc-500">Everything you&apos;ve studied, in the app and off it.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition" />
            </Link>
          </section>
        </>
      )}

      {/* Analytics (moved here from the dashboard) */}
      <section className="space-y-3">
        <SectionTitle>Activity</SectionTitle>
        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            {/* Phone gets the compact chart built for it */}
            <div className="sm:hidden -mx-4"><MobileReadingChart /></div>
            <div className={cn(card, "hidden sm:block p-6 h-[420px] relative overflow-hidden")}>
              <h3 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-4">In-app reading · last 7 days</h3>
              <Charts />
            </div>
            <div className={cn(card, "p-3 sm:p-6")}>
              <ActivityHeatmap data={analytics?.heatmap || []} loading={analyticsLoading} />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className={cn(card, "overflow-hidden")}><GoalsCard /></div>
            <div className={cn(card, "overflow-hidden")}><AIInsights /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
