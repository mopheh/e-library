"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEGREE_CLASSES,
  MAX_GPA,
  degreeClass,
  requiredGpa,
  round2,
  semestersToReach,
} from "@/lib/grading";
import { type Grades, useUpdateAcademicProfile } from "@/hooks/useGrades";

// Colour per class of degree - used for the CGPA figure, pill and scale marker
export const CLASS_TONE: Record<string, { text: string; pill: string; dot: string }> = {
  FIRST: { text: "text-emerald-600 dark:text-emerald-400", pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300", dot: "bg-emerald-500" },
  SECOND_UPPER: { text: "text-indigo-600 dark:text-indigo-400", pill: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300", dot: "bg-indigo-500" },
  SECOND_LOWER: { text: "text-amber-600 dark:text-amber-400", pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300", dot: "bg-amber-500" },
  THIRD: { text: "text-orange-600 dark:text-orange-400", pill: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300", dot: "bg-orange-500" },
  NONE: { text: "text-rose-600 dark:text-rose-400", pill: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300", dot: "bg-rose-500" },
};

const card = "rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm";

/** 0-5 track with the class boundaries marked and the student's position. */
function ClassScale({ cgpa }: { cgpa: number }) {
  const tone = CLASS_TONE[degreeClass(cgpa).key];
  const bounds = DEGREE_CLASSES.filter((c) => c.min > 0);
  return (
    <div className="pt-6 pb-1">
      <div className="relative h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={cn("absolute inset-y-0 left-0 rounded-full opacity-80", tone.dot)} style={{ width: `${(cgpa / MAX_GPA) * 100}%` }} />
        {bounds.map((c) => (
          <div key={c.key} className="absolute -top-1 -bottom-1 w-px bg-zinc-300 dark:bg-zinc-600" style={{ left: `${(c.min / MAX_GPA) * 100}%` }}>
            <span className="absolute -top-5 -translate-x-1/2 text-[9px] font-bold text-zinc-400 whitespace-nowrap">
              {c.short} {c.min.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function gradeHint(needed: number) {
  if (needed >= 4.5) return "mostly A's";
  if (needed >= 3.5) return "mostly A's and B's";
  if (needed >= 2.5) return "mostly B's and C's";
  return "C's and above";
}

export function CgpaHero({ data }: { data: Grades }) {
  const { cgpa, totalUnits, degreeClass: cls, next } = data.summary;
  if (cgpa == null || !cls) return null;
  const tone = CLASS_TONE[cls.key];

  return (
    <div className={cn(card, "p-5 sm:p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">Current CGPA</p>
          <p className={cn("text-5xl sm:text-6xl font-black font-cabin tracking-tighter mt-1", tone.text)}>{cgpa.toFixed(2)}</p>
          <span className={cn("inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap", tone.pill)}>{cls.label}</span>
        </div>
        <div className="text-right text-xs text-zinc-500 space-y-1 pt-1">
          <p><span className="font-bold text-zinc-800 dark:text-zinc-200">{totalUnits}</span> units counted</p>
          <p className="flex items-center gap-1 justify-end"><Lock className="w-3 h-3" /> Only you can see this</p>
        </div>
      </div>

      <ClassScale cgpa={cgpa} />

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-zinc-400 shrink-0" />
        {next ? (
          <span><b>{next.gap.toFixed(2)}</b> away from {next.label} ({next.min.toFixed(2)})</span>
        ) : (
          <span>You&apos;re in the top class. Stay at 4.50 or above to keep it.</span>
        )}
      </p>
    </div>
  );
}

const TARGET_PRESETS = DEGREE_CLASSES.filter((c) => c.min > 0);

export function TargetPlanner({ data, defaultUnits }: { data: Grades; defaultUnits: number }) {
  const { summary, profile } = data;
  const saveProfile = useUpdateAcademicProfile();
  const [target, setTarget] = useState<number>(profile.targetCgpa ?? nextTarget(summary.cgpa));
  const [custom, setCustom] = useState(false);
  const [units, setUnits] = useState(defaultUnits);

  useEffect(() => setUnits(defaultUnits), [defaultUnits]);

  const current = { points: summary.totalPoints, units: summary.totalUnits };
  const needed = requiredGpa(current, target, units);
  const cls = degreeClass(target);
  const isSaved = profile.targetCgpa != null && round2(profile.targetCgpa) === round2(target);

  if (summary.cgpa == null) return null;

  let verdict: React.ReactNode;
  if (needed == null) {
    verdict = <p className="text-sm text-zinc-500">Enter this semester&apos;s units to see what you need.</p>;
  } else if (needed <= 0) {
    verdict = (
      <p className="text-sm">
        <b className="text-emerald-600 dark:text-emerald-400">You&apos;re safe.</b> Any result this semester keeps you at {target.toFixed(2)} or above.
      </p>
    );
  } else if (needed <= MAX_GPA) {
    verdict = (
      <p className="text-sm text-zinc-700 dark:text-zinc-200">
        You need a GPA of <b className="text-2xl font-black font-cabin text-indigo-600 dark:text-indigo-400 align-middle">{needed.toFixed(2)}</b> this
        semester ({gradeHint(needed)}) to reach {target.toFixed(2)}.
      </p>
    );
  } else {
    const n = semestersToReach(current, target, units);
    verdict = (
      <p className="text-sm text-zinc-700 dark:text-zinc-200">
        <b className="text-amber-600 dark:text-amber-400">Not reachable this semester</b> (it would need {needed.toFixed(2)}).{" "}
        {n
          ? `With straight A's it takes about ${n} semester${n === 1 ? "" : "s"} at ${units} units each.`
          : `At ${units} units a semester it would take more than 8 semesters of straight A's, so set a nearer target first.`}
      </p>
    );
  }

  return (
    <div className={cn(card, "p-5 sm:p-6 space-y-4")}>
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-indigo-600" />
        <h2 className="font-cabin font-black text-base tracking-tight">What do I need?</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {TARGET_PRESETS.map((c) => (
          <button
            key={c.key}
            onClick={() => { setCustom(false); setTarget(c.min); }}
            className={cn(
              "px-3 py-2 rounded-xl border text-xs font-semibold transition active:scale-95",
              !custom && round2(target) === c.min
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300",
            )}
          >
            {c.label} <span className="opacity-70">{c.min.toFixed(2)}</span>
          </button>
        ))}
        <button
          onClick={() => setCustom(true)}
          className={cn(
            "px-3 py-2 rounded-xl border text-xs font-semibold transition",
            custom ? "bg-indigo-600 border-indigo-600 text-white" : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300",
          )}
        >
          Custom
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {custom && (
          <label className="text-xs text-zinc-500 space-y-1">
            <span className="block font-semibold">Target CGPA</span>
            <input
              type="number" inputMode="decimal" min={0} max={5} step={0.01}
              value={target}
              onChange={(e) => setTarget(Math.min(5, Math.max(0, Number(e.target.value) || 0)))}
              className="w-24 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </label>
        )}
        <label className="text-xs text-zinc-500 space-y-1">
          <span className="block font-semibold">Units this semester</span>
          <input
            type="number" inputMode="numeric" min={1} max={60}
            value={units || ""}
            onChange={(e) => setUnits(Math.max(0, Math.min(60, Math.floor(Number(e.target.value) || 0))))}
            className="w-24 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
          />
        </label>
        {!isSaved && (
          <button
            onClick={() =>
              saveProfile.mutate({ targetCgpa: round2(target) }, {
                onSuccess: () => toast.success(`Target set: ${cls.label} (${target.toFixed(2)})`),
                onError: (e) => toast.error(e.message),
              })
            }
            disabled={saveProfile.isPending}
            className="px-4 py-2 rounded-xl text-xs font-bold font-cabin uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 disabled:opacity-60"
          >
            Set as my target
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-4">{verdict}</div>
    </div>
  );
}

function nextTarget(cgpa: number | null) {
  if (cgpa == null) return 4.5;
  const above = [...TARGET_PRESETS].reverse().find((c) => c.min > round2(cgpa));
  return above?.min ?? 4.5;
}
