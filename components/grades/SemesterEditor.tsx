"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  GRADE_POINTS,
  GRADE_SCORE_RANGES,
  LETTER_GRADES,
  type LetterGrade,
  gpa,
  recentSessions,
  round2,
  totals,
} from "@/lib/grading";
import { useEnrolledCourses } from "@/hooks/useEnrolledCourses";
import { useUserData } from "@/hooks/useUsers";
import { type Grades, type SemesterInput, type SemesterResult, useDeleteSemester, useSaveSemester } from "@/hooks/useGrades";

type Level = SemesterInput["level"];
const LEVELS: Level[] = ["100", "200", "300", "400", "500", "600"];

interface Row {
  key: string;
  courseId: string | null;
  courseCode: string;
  courseTitle: string | null;
  units: number;
  grade: LetterGrade | null;
}

const newKey = () => Math.random().toString(36).slice(2);

function bumpSession(session: string) {
  const start = Number(session.slice(0, 4)) + 1;
  return `${start}/${start + 1}`;
}
function bumpLevel(level: Level): Level {
  const i = LEVELS.indexOf(level);
  return LEVELS[Math.min(i + 1, LEVELS.length - 1)];
}

const GRADE_TONE: Record<LetterGrade, string> = {
  A: "bg-emerald-600 border-emerald-600",
  B: "bg-indigo-600 border-indigo-600",
  C: "bg-sky-600 border-sky-600",
  D: "bg-amber-500 border-amber-500",
  E: "bg-orange-500 border-orange-500",
  F: "bg-rose-600 border-rose-600",
};

export function SemesterEditor({ open, onOpenChange, editing, data }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SemesterResult | null; // null = new semester
  data: Grades;
}) {
  const { data: enrolled } = useEnrolledCourses();
  const { data: me } = useUserData();
  const save = useSaveSemester();
  const del = useDeleteSemester();
  const sessions = useMemo(() => recentSessions(), []);

  const [session, setSession] = useState(sessions[0]);
  const [semester, setSemester] = useState<"FIRST" | "SECOND">("FIRST");
  const [level, setLevel] = useState<Level>("100");
  const [rows, setRows] = useState<Row[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Initialise once per open
  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (editing) {
      setSession(editing.session);
      setSemester(editing.semester);
      setLevel(editing.level as Level);
      setRows(editing.courses.map((c) => ({ key: newKey(), courseId: c.courseId, courseCode: c.courseCode, courseTitle: c.courseTitle, units: c.units, grade: c.grade })));
    } else {
      // Default to the semester after the latest one on record (results
      // usually come in order), else the current session's first semester
      const last = data.semesters.at(-1);
      if (last) {
        const nextSession = last.semester === "SECOND" ? bumpSession(last.session) : last.session;
        const nextLevel = last.semester === "SECOND" ? bumpLevel(last.level as Level) : (last.level as Level);
        setSession(nextSession);
        setSemester(last.semester === "FIRST" ? "SECOND" : "FIRST");
        setLevel(nextLevel);
      } else {
        setSession(sessions[0]);
        setSemester("FIRST");
        setLevel(me?.level ?? me?.year ?? "100");
      }
      setRows([]);
    }
  }, [open, editing]);

  const registeredForSemester = (enrolled ?? []).filter(
    (c) => c.semester === semester && !rows.some((r) => r.courseCode === c.courseCode),
  );

  const addRegistered = () =>
    setRows((rs) => [
      ...rs,
      ...registeredForSemester.map((c) => ({ key: newKey(), courseId: c.id, courseCode: c.courseCode, courseTitle: c.title, units: c.unitLoad, grade: null })),
    ]);

  const addBlank = () => setRows((rs) => [...rs, { key: newKey(), courseId: null, courseCode: "", courseTitle: null, units: 3, grade: null }]);
  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  const graded = rows.filter((r): r is Row & { grade: LetterGrade } => r.grade !== null && r.units > 0);
  const semesterGpa = gpa(graded);

  const clash = data.semesters.find((s) => s.session === session && s.semester === semester && s.id !== editing?.id);

  // Projected CGPA: everything else on record + this semester as entered.
  // Whatever this save replaces (the row being edited, or an existing row
  // for the chosen term) must come out first or it counts twice.
  const others = { points: data.summary.totalPoints, units: data.summary.totalUnits };
  for (const replaced of [editing, clash]) {
    if (!replaced) continue;
    const t = totals(replaced.courses);
    others.points -= t.points;
    others.units -= t.units;
  }
  const thisTerm = totals(graded);
  const projected = others.units + thisTerm.units ? round2((others.points + thisTerm.points) / (others.units + thisTerm.units)) : null;
  const incomplete = rows.length === 0 || rows.some((r) => !r.grade || !r.courseCode.trim() || r.units < 1);
  const dupCodes = new Set(rows.map((r) => r.courseCode.trim().toUpperCase().replace(/\s+/g, ""))).size !== rows.length;

  const submit = () => {
    if (incomplete || dupCodes) return;
    save.mutate(
      {
        session, semester, level,
        courses: rows.map((r) => ({ courseId: r.courseId, courseCode: r.courseCode.trim(), courseTitle: r.courseTitle, units: r.units, grade: r.grade! })),
      },
      {
        onSuccess: (res) => {
          onOpenChange(false);
          toast.success(`Saved ${session} ${semester === "FIRST" ? "first" : "second"} semester`, {
            description: `GPA ${semesterGpa?.toFixed(2)} · CGPA now ${res.summary.cgpa?.toFixed(2)}`,
          });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[120] mx-auto w-full max-w-2xl max-h-[92dvh] rounded-t-[28px] sm:bottom-4 sm:rounded-[28px] border-zinc-200 dark:border-zinc-800 p-0 gap-0 font-poppins"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />
        <SheetHeader className="px-5 pt-4 pb-2">
          <SheetTitle className="font-cabin font-black text-xl tracking-tight">{editing ? "Edit results" : "Add semester results"}</SheetTitle>
          <SheetDescription className="text-xs">Enter the grades from your result slip.</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-5 pb-4 space-y-5">
          {/* Term */}
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 space-y-1">
              <span className="block">Session</span>
              <select value={session} onChange={(e) => setSession(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold normal-case tracking-normal text-zinc-900 dark:text-zinc-100">
                {(sessions.includes(session) ? sessions : [session, ...sessions]).map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 space-y-1">
              <span className="block">Semester</span>
              <select value={semester} onChange={(e) => setSemester(e.target.value as "FIRST" | "SECOND")}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold normal-case tracking-normal text-zinc-900 dark:text-zinc-100">
                <option value="FIRST">First</option>
                <option value="SECOND">Second</option>
              </select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400 space-y-1">
              <span className="block">Level</span>
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold normal-case tracking-normal text-zinc-900 dark:text-zinc-100">
                {LEVELS.map((l) => <option key={l} value={l}>{l}L</option>)}
              </select>
            </label>
          </div>

          {clash && (
            <p className="text-xs rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-3 py-2">
              You already saved results for this semester. Saving will replace them.
            </p>
          )}

          {/* Courses */}
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  {r.courseId ? (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{r.courseCode}</p>
                      {r.courseTitle && <p className="text-[11px] text-zinc-500 truncate">{r.courseTitle}</p>}
                    </div>
                  ) : (
                    <input
                      value={r.courseCode}
                      onChange={(e) => update(r.key, { courseCode: e.target.value.toUpperCase().slice(0, 20) })}
                      placeholder="Course code e.g. GST111"
                      className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold"
                    />
                  )}
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 shrink-0">
                    <input
                      type="number" inputMode="numeric" min={1} max={12} aria-label={`Units for ${r.courseCode || "course"}`}
                      value={r.units || ""}
                      onChange={(e) => update(r.key, { units: Math.max(0, Math.min(12, Math.floor(Number(e.target.value) || 0))) })}
                      className="w-12 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-center font-semibold text-zinc-900 dark:text-zinc-100"
                    />
                    units
                  </label>
                  <button onClick={() => remove(r.key)} aria-label="Remove course" className="p-1.5 text-zinc-300 hover:text-rose-500 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {LETTER_GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => update(r.key, { grade: g })}
                      title={`${g}: ${GRADE_SCORE_RANGES[g]} marks, ${GRADE_POINTS[g]} points`}
                      aria-pressed={r.grade === g}
                      className={cn(
                        "py-2 rounded-xl border text-sm font-black font-cabin transition active:scale-95",
                        r.grade === g ? cn(GRADE_TONE[g], "text-white") : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300",
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              {!editing && registeredForSemester.length > 0 && (
                <button onClick={addRegistered}
                  className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  + My {registeredForSemester.length} registered {semester === "FIRST" ? "first" : "second"}-semester course{registeredForSemester.length === 1 ? "" : "s"}
                </button>
              )}
              <button onClick={addBlank}
                className="px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add a course
              </button>
            </div>
            {dupCodes && <p className="text-xs text-rose-600">Each course can only appear once.</p>}
          </div>

          {editing && (
            confirmDelete ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">Delete this semester&apos;s results?</span>
                <button
                  onClick={() => del.mutate(editing.id, {
                    onSuccess: () => { onOpenChange(false); toast.success("Semester deleted"); },
                    onError: (e) => toast.error(e.message),
                  })}
                  disabled={del.isPending}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold disabled:opacity-60"
                >
                  Delete
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1.5 font-semibold text-zinc-500">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <Trash2 className="w-3.5 h-3.5" /> Delete semester
              </button>
            )
          )}
        </div>

        <div className="px-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3"
             style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Semester GPA <b className="text-base font-black font-cabin text-zinc-900 dark:text-zinc-100 ml-1">{semesterGpa?.toFixed(2) ?? "–"}</b> · {thisTerm.units} units</span>
            <span>CGPA → <b className="text-base font-black font-cabin text-indigo-600 dark:text-indigo-400 ml-1">{projected?.toFixed(2) ?? "–"}</b></span>
          </div>
          <button
            onClick={submit}
            disabled={incomplete || dupCodes || save.isPending}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-black font-cabin uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-colors"
          >
            {save.isPending ? "Saving…" : rows.length === 0 ? "Add your courses" : incomplete ? "Pick a grade for every course" : "Save results"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
