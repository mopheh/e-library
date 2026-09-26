"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Info, Lock, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { round2 } from "@/lib/grading";
import { useEnrolledCourses } from "@/hooks/useEnrolledCourses";
import { useUserData } from "@/hooks/useUsers";
import { type Grades, type SemesterResult, useGrades, useUpdateAcademicProfile } from "@/hooks/useGrades";
import { CgpaHero, TargetPlanner } from "@/components/grades/CgpaSummary";
import { GpaTrendChart } from "@/components/grades/GpaTrendChart";
import { SemesterEditor } from "@/components/grades/SemesterEditor";
import { SemesterList } from "@/components/grades/SemesterList";

const card = "rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm";
const input = "w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-100";

/** Quick start: CGPA + units so far, for everything not entered as semesters. */
function PriorCgpaForm({ data, compact, onDone }: { data: Grades; compact?: boolean; onDone?: () => void }) {
  const save = useUpdateAcademicProfile();
  const [cgpa, setCgpa] = useState(data.profile.priorCgpa?.toFixed(2) ?? "");
  const [units, setUnits] = useState(data.profile.priorUnits?.toString() ?? "");

  const cgpaNum = Number(cgpa);
  const unitsNum = Number(units);
  const valid = cgpa !== "" && cgpaNum >= 0 && cgpaNum <= 5 && Number.isInteger(unitsNum) && unitsNum >= 1 && unitsNum <= 400;

  const submit = () => {
    if (!valid) return;
    save.mutate(
      { priorCgpa: round2(cgpaNum), priorUnits: unitsNum },
      { onSuccess: () => { toast.success("CGPA saved"); onDone?.(); }, onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-zinc-500 space-y-1">
          <span className="block font-semibold">CGPA</span>
          <input type="number" inputMode="decimal" min={0} max={5} step={0.01} placeholder="e.g. 3.85"
            value={cgpa} onChange={(e) => setCgpa(e.target.value)} className={input} />
        </label>
        <label className="text-xs text-zinc-500 space-y-1">
          <span className="block font-semibold">Total units it covers</span>
          <input type="number" inputMode="numeric" min={1} max={400} placeholder="e.g. 96"
            value={units} onChange={(e) => setUnits(e.target.value)} className={input} />
        </label>
      </div>
      {!compact && (
        <p className="text-[11px] text-zinc-500">
          Both are on your last result slip. Units matter: a 4.0 over 120 units moves much less than a 4.0 over 30.
        </p>
      )}
      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={!valid || save.isPending}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold font-cabin uppercase tracking-wider">
          {save.isPending ? "Saving…" : "Save"}
        </button>
        {data.profile.priorCgpa != null && (
          <button
            onClick={() => save.mutate({ priorCgpa: null }, { onSuccess: () => { toast.success("Removed"); onDone?.(); } })}
            className="px-3 py-2.5 text-xs font-semibold text-zinc-500 hover:text-rose-600">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ data, onAddSemester }: { data: Grades; onAddSemester: () => void }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className={cn(card, "p-5 space-y-4")}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><Zap className="w-4 h-4" /></div>
          <div>
            <p className="font-cabin font-black tracking-tight">Quick start</p>
            <p className="text-xs text-zinc-500">Enter your current CGPA. Takes 10 seconds.</p>
          </div>
        </div>
        <PriorCgpaForm data={data} />
      </div>
      <div className={cn(card, "p-5 flex flex-col gap-4")}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><GraduationCap className="w-4 h-4" /></div>
          <div>
            <p className="font-cabin font-black tracking-tight">Add semester results</p>
            <p className="text-xs text-zinc-500">Enter your grades course by course for a GPA trend.</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 flex-1">
          Your registered courses and their units are filled in for you. You can do both: a quick-start CGPA for
          past semesters, then add new semesters as results come out.
        </p>
        <button onClick={onAddSemester}
          className="self-start px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-cabin uppercase tracking-wider">
          Add a semester
        </button>
      </div>
    </div>
  );
}

export default function GradesPage() {
  const { data, isLoading, isError } = useGrades();
  const { data: enrolled } = useEnrolledCourses();
  const { data: me } = useUserData();
  const [editor, setEditor] = useState<{ open: boolean; editing: SemesterResult | null }>({ open: false, editing: null });
  const [editingPrior, setEditingPrior] = useState(false);

  // Planner default: this semester's registered units (the heavier term if
  // courses from both are registered), else the last recorded semester.
  const defaultUnits = useMemo(() => {
    const byTerm = { FIRST: 0, SECOND: 0 };
    (enrolled ?? []).forEach((c) => { byTerm[c.semester] += c.unitLoad; });
    const registered = Math.max(byTerm.FIRST, byTerm.SECOND);
    return registered || data?.semesters.at(-1)?.units || 24;
  }, [enrolled, data]);

  useEffect(() => { if (data?.profile.priorCgpa == null) setEditingPrior(false); }, [data?.profile.priorCgpa]);

  const openNew = () => setEditor({ open: true, editing: null });
  const hasAnything = data && (data.semesters.length > 0 || data.profile.priorCgpa != null);

  if (me?.role === "ASPIRANT") {
    return <p className="p-8 text-sm text-zinc-500">Grades are for enrolled students. They&apos;ll be here once you&apos;re admitted.</p>;
  }

  return (
    <div className="flex-1 p-4 sm:p-5 md:p-8 pt-3 space-y-6 min-h-screen font-poppins bg-zinc-50/50 dark:bg-zinc-950">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Academics</p>
          <h1 className="text-2xl md:text-3xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Grades</h1>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Private to you. UNIBEN 5-point scale.</p>
        </div>
        {hasAnything && (
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black font-cabin text-[11px] uppercase tracking-widest shadow-md shadow-indigo-500/20 transition">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add</span> semester
          </button>
        )}
      </div>

      {isError ? (
        <p className="text-sm text-rose-600">Couldn&apos;t load your grades. Please refresh.</p>
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <div className="h-48 rounded-[22px] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-40 rounded-[22px] bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
      ) : !hasAnything ? (
        <EmptyState data={data} onAddSemester={openNew} />
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-4">
            <CgpaHero data={data} />
            <TargetPlanner data={data} defaultUnits={defaultUnits} />
          </div>

          <GpaTrendChart data={data} />

          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">Semesters</h2>

            <SemesterList data={data} onEdit={(s) => setEditor({ open: true, editing: s })} />

            {/* Quick-start baseline, the oldest entry, so it goes last */}
            <div className={cn(card, "p-4")}>
              {editingPrior || data.profile.priorCgpa == null ? (
                <>
                  <p className="text-sm font-semibold mb-3">
                    {data.profile.priorCgpa == null ? "Add your CGPA from earlier semesters" : "Earlier semesters"}
                  </p>
                  <PriorCgpaForm data={data} compact onDone={() => setEditingPrior(false)} />
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-cabin font-black tracking-tight">Earlier semesters</p>
                    <p className="text-xs text-zinc-500">CGPA {data.profile.priorCgpa.toFixed(2)} over {data.profile.priorUnits} units (quick start)</p>
                  </div>
                  <button onClick={() => setEditingPrior(true)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Edit</button>
                </div>
              )}
            </div>

          </section>

          <p className="flex items-start gap-2 text-xs text-zinc-500">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            The quick-start CGPA should only cover semesters you haven&apos;t added above, or they&apos;ll count twice.
            Grades: A 70+ (5), B 60–69 (4), C 50–59 (3), D 45–49 (2), E 40–44 (1), F below 40 (0).
          </p>
        </>
      )}

      {data && (
        <SemesterEditor
          open={editor.open}
          editing={editor.editing}
          data={data}
          onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        />
      )}
    </div>
  );
}
