"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, CalendarClock, CheckCircle2, ClipboardList, Clock, NotebookPen, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PlanCourse, usePlan } from "@/hooks/usePlan";
import type { ReadinessBand } from "@/lib/planner";
import { formatMinutes } from "@/components/study-log/LogStudySheet";

// Status colours, validated on both surfaces with the dataviz script. The
// amber/green pair is in the CVD 6-8 floor band, so status ALWAYS ships with
// an icon and a text label - never colour alone.
export const BAND: Record<ReadinessBand, { label: string; stroke: string; text: string; icon: React.ElementType }> = {
  ON_TRACK: { label: "On track", stroke: "#059669", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 },
  GETTING_THERE: { label: "Getting there", stroke: "#d97706", text: "text-amber-700 dark:text-amber-400", icon: TrendingUp },
  NEEDS_ATTENTION: { label: "Needs attention", stroke: "#e11d48", text: "text-rose-700 dark:text-rose-400", icon: AlertTriangle },
};

export function ReadinessRing({ value, band, size = 64 }: { value: number; band: ReadinessBand; size?: number }) {
  const stroke = size >= 56 ? 6 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${value}% ready, ${BAND[band].label}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-zinc-100 dark:stroke-zinc-800" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={BAND[band].stroke} strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center font-black font-cabin text-zinc-900 dark:text-zinc-50", size >= 56 ? "text-base" : "text-[11px]")}>
        {value}
      </span>
    </div>
  );
}

export function BandLabel({ band, className }: { band: ReadinessBand; className?: string }) {
  const { label, text, icon: Icon } = BAND[band];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold", text, className)}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

export function examLabel(days: number | null) {
  if (days == null) return null;
  if (days < 0) return null;
  if (days === 0) return "Exam today";
  if (days === 1) return "Exam tomorrow";
  return `Exam in ${days} days`;
}

function Part({ label, score, detail }: { label: string; score: number | null; detail: string }) {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <span className="truncate">{label}</span>
        <span className="text-zinc-600 dark:text-zinc-300">{score == null ? "–" : `${Math.round(score * 100)}%`}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {score != null && <div className="h-full rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ width: `${Math.round(score * 100)}%` }} />}
      </div>
      <p className="text-[10px] text-zinc-500 truncate">{detail}</p>
    </div>
  );
}

export function CourseReadinessCard({ course, onLog }: { course: PlanCourse; onLog: () => void }) {
  const { parts } = course;
  const exam = examLabel(course.daysToExam);
  const weekPct = course.plannedMinutes ? Math.min(100, (course.doneMinutes / course.plannedMinutes) * 100) : 0;

  return (
    <div className="rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <ReadinessRing value={course.readiness} band={course.band} />
        <div className="min-w-0 flex-1">
          <p className="font-cabin font-black text-base tracking-tight text-zinc-900 dark:text-zinc-50">{course.courseCode}</p>
          <p className="text-xs text-zinc-500 truncate">{course.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            <BandLabel band={course.band} />
            {exam && (
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", course.daysToExam! <= 7 ? "text-rose-600 dark:text-rose-400" : "text-zinc-500")}>
                <CalendarClock className="w-3.5 h-3.5" /> {exam}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* This week vs plan */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-zinc-500"><Clock className="w-3.5 h-3.5" /> This week</span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            {formatMinutes(course.doneMinutes)} <span className="text-zinc-400 font-normal">of {formatMinutes(course.plannedMinutes)}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${weekPct}%` }} />
        </div>
      </div>

      {/* Why this score */}
      <div className="grid grid-cols-3 gap-3">
        <Part label="Study" score={parts.effort.score} detail={`${formatMinutes(parts.effort.studied)} in 14 days`} />
        <Part
          label="Practice"
          score={parts.practice.score}
          detail={!parts.practice.available ? "No CBT bank yet" : parts.practice.attempts ? `Last ${Math.min(3, parts.practice.attempts)} CBTs` : "No CBT yet"}
        />
        <Part
          label="Materials"
          score={parts.coverage.score}
          detail={parts.coverage.materials ? `${parts.coverage.opened}/${parts.coverage.materials} opened` : "None uploaded"}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-50 dark:border-zinc-800/60">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 pt-2 truncate">{course.nextStep.label}</p>
        <div className="flex items-center gap-1 pt-2 shrink-0">
          <Link href={`/workspaces/${course.courseId}`} aria-label={`Study ${course.courseCode}`}
            className="p-2 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40" title="Open course workspace">
            <BookOpen className="w-4 h-4" />
          </Link>
          {parts.practice.available && (
            <Link href={`/cbt?course=${course.courseId}`} aria-label={`Practice ${course.courseCode}`}
              className="p-2 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40" title="Practice CBT">
              <ClipboardList className="w-4 h-4" />
            </Link>
          )}
          <button onClick={onLog} aria-label={`Log study for ${course.courseCode}`}
            className="p-2 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40" title="Log study">
            <NotebookPen className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact horizontal strip for the dashboards: ring + code + band per course. */
export function ReadinessStrip({ courses, className }: { courses: PlanCourse[]; className?: string }) {
  if (courses.length === 0) return null;
  return (
    // Swipe row on phones; wraps on wider screens so no course is hidden
    <div className={cn("flex gap-3 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible", className)}>
      {courses.map((c) => (
        <Link
          key={c.courseId}
          href="/dashboard/progress"
          className="shrink-0 w-44 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition"
        >
          <ReadinessRing value={c.readiness} band={c.band} size={44} />
          <div className="min-w-0">
            <p className="text-sm font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 truncate">{c.courseCode}</p>
            <BandLabel band={c.band} className="text-[10px] whitespace-nowrap" />
            {examLabel(c.daysToExam) && <p className="text-[10px] text-zinc-500 truncate">{examLabel(c.daysToExam)}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Self-loading readiness section for the dashboards. */
export function DashboardReadiness({ className, title = "Exam readiness", tourId }: { className?: string; title?: string; tourId?: string }) {
  const { data: plan, isLoading } = usePlan();
  // Renders nothing at all (including any card frame passed via className)
  // when there are no courses, so the dashboard never shows an empty box
  if (isLoading || !plan || plan.courses.length === 0) return null;
  return (
    <div className={cn("space-y-3", className)} data-tour={tourId}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">{title}</p>
        <Link href="/dashboard/progress" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Full plan →</Link>
      </div>
      <ReadinessStrip courses={plan.courses} />
    </div>
  );
}
