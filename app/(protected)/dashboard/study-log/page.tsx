"use client";

import React, { useMemo, useState } from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { toast } from "sonner";
import { Clock, Info, NotebookPen, Plus, Repeat, Smartphone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { lagosDate } from "@/lib/time";
import { type CourseWeek, type StudyLog, useDeleteStudyLog, useStudyLogs } from "@/hooks/useStudyLogs";
import { STUDY_METHODS, formatMinutes, useLogStudySheet } from "@/components/study-log/LogStudySheet";

function dayLabel(date: string, today: string) {
  if (date === today) return "Today";
  if (date === lagosDate(new Date(Date.now() - 86_400_000))) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short" }).format(parseISO(date));
}

function lastStudiedLabel(date: string | null, today: string) {
  if (!date) return "Not studied this week";
  if (date === today) return "Studied today";
  return `Last studied ${formatDistanceToNowStrict(parseISO(date), { addSuffix: true })}`;
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 p-4 shadow-sm">
      <Icon className="w-4 h-4 text-indigo-600 mb-2" />
      <p className="text-xl sm:text-2xl font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
    </div>
  );
}

function CourseCard({ c, maxMinutes, today, onLog }: {
  c: CourseWeek; maxMinutes: number; today: string; onLog: () => void;
}) {
  const total = c.appMinutes + c.manualMinutes;
  const untouched = total === 0 && c.manualTimes === 0;
  const appPct = maxMinutes ? (c.appMinutes / maxMinutes) * 100 : 0;
  const manualPct = maxMinutes ? (c.manualMinutes / maxMinutes) * 100 : 0;

  return (
    <div className={cn(
      "rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 p-4 shadow-sm flex flex-col gap-3",
      untouched && "opacity-70",
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-cabin font-black text-base tracking-tight text-zinc-900 dark:text-zinc-50">{c.courseCode}</p>
          <p className="text-xs text-zinc-500 truncate">{c.title}</p>
        </div>
        <button
          onClick={onLog}
          aria-label={`Log study for ${c.courseCode}`}
          className="shrink-0 w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* In-app (solid) + logged (lighter) time, scaled to the busiest course */}
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
        <div className="h-full bg-indigo-600" style={{ width: `${appPct}%` }} />
        <div className="h-full bg-indigo-300 dark:bg-indigo-300/60" style={{ width: `${manualPct}%` }} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        {c.appMinutes > 0 && (
          <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> {formatMinutes(c.appMinutes)} in app</span>
        )}
        {c.manualTimes > 0 && (
          <span className="flex items-center gap-1">
            <NotebookPen className="w-3 h-3" /> {c.manualTimes}× logged{c.manualMinutes ? ` · ${formatMinutes(c.manualMinutes)}` : ""}
          </span>
        )}
        <span className={cn(untouched && "text-amber-600 dark:text-amber-500 font-medium")}>
          {lastStudiedLabel(c.lastStudied, today)}
        </span>
      </div>
    </div>
  );
}

function LogRow({ log }: { log: StudyLog }) {
  const del = useDeleteStudyLog();
  const [confirming, setConfirming] = useState(false);
  const method = STUDY_METHODS.find((m) => m.value === log.method) ?? STUDY_METHODS[0];
  const Icon = method.icon;

  return (
    <li className="flex items-start gap-3 py-3">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {log.courseCode}{" "}
          <span className="font-normal text-zinc-500">
            · {log.timesRead}×{log.minutes ? ` · ${formatMinutes(log.minutes)}` : ""} · {method.label}
          </span>
        </p>
        {log.note && <p className="text-xs text-zinc-500 mt-0.5 break-words">{log.note}</p>}
      </div>
      {confirming ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() =>
              del.mutate(log.id, {
                onSuccess: () => toast.success("Log deleted"),
                onError: () => toast.error("Couldn't delete this log"),
              })
            }
            disabled={del.isPending}
            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold disabled:opacity-60"
          >
            Delete
          </button>
          <button onClick={() => setConfirming(false)} className="px-2 py-1.5 text-[11px] font-semibold text-zinc-500">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          aria-label="Delete log"
          className="shrink-0 p-2 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </li>
  );
}

export default function StudyLogPage() {
  const { data, isLoading, isError } = useStudyLogs();
  const { openLogStudy } = useLogStudySheet();
  const today = data?.today ?? lagosDate();

  const { weekTimes, weekMinutes, touched, maxMinutes } = useMemo(() => {
    const weekly = data?.weekly ?? [];
    return {
      weekTimes: weekly.reduce((s, c) => s + c.manualTimes, 0),
      weekMinutes: weekly.reduce((s, c) => s + c.appMinutes + c.manualMinutes, 0),
      touched: weekly.filter((c) => c.appMinutes + c.manualMinutes + c.manualTimes > 0).length,
      maxMinutes: Math.max(0, ...weekly.map((c) => c.appMinutes + c.manualMinutes)),
    };
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, StudyLog[]>();
    (data?.logs ?? []).forEach((l) => map.set(l.date, [...(map.get(l.date) ?? []), l]));
    return [...map.entries()];
  }, [data]);

  return (
    <div className="flex-1 p-4 sm:p-5 md:p-8 pt-3 space-y-7 min-h-screen font-poppins bg-zinc-50/50 dark:bg-zinc-950">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Academics</p>
          <h1 className="text-2xl md:text-3xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Study log</h1>
          <p className="text-sm text-zinc-500 mt-1">What you&apos;ve studied this week, in the app and off it.</p>
        </div>
        <button
          onClick={() => openLogStudy()}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black font-cabin text-[11px] uppercase tracking-widest shadow-md shadow-indigo-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Log study
        </button>
      </div>

      {isError ? (
        <p className="text-sm text-rose-600">Couldn&apos;t load your study log. Please refresh.</p>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-3">{[0, 1, 2].map((i) => <div key={i} className="flex-1 h-24 rounded-[20px] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-[22px] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}</div>
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            <Stat icon={Clock} label="Time this week" value={weekMinutes ? formatMinutes(weekMinutes) : "0m"} />
            <Stat icon={Repeat} label="Sittings logged" value={String(weekTimes)} />
            <Stat icon={NotebookPen} label="Courses studied" value={`${touched}/${data?.weekly.length ?? 0}`} />
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">Last 7 days by course</h2>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600" /> In app</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-300 dark:bg-indigo-300/60" /> Logged</span>
              </div>
            </div>
            {data && data.weekly.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.weekly.map((c) => (
                  <CourseCard key={c.courseId} c={c} maxMinutes={maxMinutes} today={today} onLog={() => openLogStudy(c.courseId)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Register your courses to see your progress by course.</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">History · last 30 days</h2>
            {grouped.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <NotebookPen className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nothing logged yet</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Read a textbook, went through lecture notes or studied with friends? Log it and it counts toward your streak.
                </p>
                <button
                  onClick={() => openLogStudy()}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold font-cabin uppercase tracking-wider"
                >
                  Log your first session
                </button>
              </div>
            ) : (
              <div className="rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm px-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                {grouped.map(([date, logs]) => (
                  <div key={date} className="py-2">
                    <p className="pt-2 text-xs font-bold text-zinc-400">{dayLabel(date, today)}</p>
                    <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                      {logs.map((l) => <LogRow key={l.id} log={l} />)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="flex items-start gap-2 text-xs text-zinc-500">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Logged study counts toward your streak, goals and activity heatmap. The leaderboard only counts reading done in the app.
          </p>
        </>
      )}
    </div>
  );
}
