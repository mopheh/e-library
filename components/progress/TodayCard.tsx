"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardList, Flame, NotebookPen, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/usePlan";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLogStudySheet } from "@/components/study-log/LogStudySheet";
import { formatMinutes } from "@/components/study-log/LogStudySheet";
import { BandLabel, examLabel } from "./Readiness";

function Mini({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Icon className={cn("w-4 h-4", tone ?? "text-white")} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">{label}</p>
        <p className="text-sm font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

/**
 * The dashboard's lead card: one thing to do today, plus the three numbers
 * that frame it (next exam, streak, this week). Everything else lives on
 * the Progress page.
 */
export function TodayCard({ className }: { className?: string }) {
  const { data: plan, isLoading } = usePlan();
  const { data: analytics } = useAnalytics();
  const { openLogStudy } = useLogStudySheet();

  if (isLoading) {
    return <div className={cn("h-44 rounded-[28px] bg-zinc-100 dark:bg-zinc-900 animate-pulse", className)} />;
  }
  // Nothing to plan without registered courses - show nothing rather than
  // a banner (the dashboard already prompts course registration)
  if (!plan || plan.courses.length === 0) return null;

  const focusCourse = plan.focus ? plan.courses.find((c) => c.courseId === plan.focus!.courseId) : undefined;
  // All caught up this week? Point at the least-ready course instead
  const weakest = [...plan.courses].sort((a, b) => a.readiness - b.readiness)[0];
  const streak = analytics?.kpis?.streak ?? 0;
  const weekPct = plan.planned ? Math.round((plan.done / plan.planned) * 100) : 0;
  const date = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date());

  return (
    <div className={cn("relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-5 sm:p-6 text-white shadow-lg shadow-indigo-500/20", className)}>
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="relative grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        {/* What to do */}
        <div className="space-y-3 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Today · {date}</p>

          {focusCourse ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-black font-cabin tracking-tight">
                {focusCourse.courseCode} <span className="text-indigo-200 font-bold">· {formatMinutes(plan.focus!.minutes)}</span>
              </h2>
              <p className="text-sm text-indigo-100 truncate">{focusCourse.title}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`/workspaces/${focusCourse.courseId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-black font-cabin uppercase tracking-wider hover:bg-indigo-50 transition">
                  Start studying <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button onClick={() => openLogStudy(focusCourse.courseId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition">
                  <NotebookPen className="w-3.5 h-3.5" /> Studied offline? Log it
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black font-cabin tracking-tight">You&apos;re on plan this week 🎉</h2>
              {weakest && (
                <>
                  <p className="text-sm text-indigo-100">Extra credit: {weakest.courseCode} is your least-ready course.</p>
                  {weakest.parts.practice.available && (
                    <Link href={`/cbt?course=${weakest.courseId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-black font-cabin uppercase tracking-wider">
                      <ClipboardList className="w-3.5 h-3.5" /> Practice {weakest.courseCode}
                    </Link>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Context */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 rounded-2xl bg-white/10 p-4">
          <Mini
            icon={CalendarClock}
            label="Next exam"
            value={plan.nextExam ? `${plan.nextExam.courseCode} · ${examLabel(plan.nextExam.days)?.replace("Exam ", "")}` : "Not set"}
            tone={plan.nextExam && plan.nextExam.days <= 7 ? "text-rose-200" : undefined}
          />
          <Mini icon={Flame} label="Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} tone="text-orange-300" />
          <Link href="/dashboard/progress" className="col-span-2 lg:col-span-1 group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Target className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">This week</p>
                  <p className="text-[11px] font-bold">{formatMinutes(plan.done)} / {formatMinutes(plan.planned || 0)}</p>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, weekPct)}%` }} />
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
          {focusCourse && (
            <div className="col-span-2 lg:col-span-1 flex items-center justify-between text-[11px]">
              <span className="text-indigo-200">{focusCourse.courseCode} readiness</span>
              <span className="flex items-center gap-2 font-bold">
                {focusCourse.readiness}%
                <BandLabel band={focusCourse.band} className="!text-white" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
