"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, FileCheck2, Paperclip, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { degreeClass } from "@/lib/grading";
import { useB2Upload } from "@/hooks/useB2Upload";
import { type Grades, type SemesterResult, openSlip, useSetSlip } from "@/hooks/useGrades";
import { CLASS_TONE } from "./CgpaSummary";

const SLIP_MAX_MB = 5;

const GRADE_PILL: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  B: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  C: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  D: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  E: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  F: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
};

function SlipControl({ result }: { result: SemesterResult }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload } = useB2Upload();
  const setSlip = useSetSlip();
  const [progress, setProgress] = useState<number | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > SLIP_MAX_MB * 1024 * 1024) {
      toast.error(`Slip must be under ${SLIP_MAX_MB}MB. Try a photo or a smaller PDF.`);
      return;
    }
    try {
      setProgress(0);
      const url = await upload(file, setProgress, { purpose: "result-slip" });
      await setSlip.mutateAsync({ id: result.id, slipUrl: url });
      toast.success("Result slip attached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const view = () => openSlip(result.id).catch((e) => toast.error(e.message));

  return (
    <>
      <input ref={inputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      {progress !== null ? (
        <span className="text-xs text-zinc-500">Uploading… {progress}%</span>
      ) : result.hasSlip ? (
        <span className="flex items-center gap-2 text-xs">
          <button onClick={view} className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <FileCheck2 className="w-3.5 h-3.5" /> Slip attached
          </button>
          <button onClick={() => inputRef.current?.click()} className="text-zinc-400 hover:text-zinc-600">Replace</button>
          <button
            onClick={() => setSlip.mutate({ id: result.id, slipUrl: null }, { onError: (e) => toast.error(e.message) })}
            className="text-zinc-400 hover:text-rose-500"
          >
            Remove
          </button>
        </span>
      ) : (
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-indigo-600">
          <Paperclip className="w-3.5 h-3.5" /> Attach result slip
        </button>
      )}
    </>
  );
}

function SemesterCard({ result, cgpaAfter, onEdit }: { result: SemesterResult; cgpaAfter: number | null; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const tone = result.gpa != null ? CLASS_TONE[degreeClass(result.gpa).key] : null;

  return (
    <div className="rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-4 p-4 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <p className="font-cabin font-black text-base tracking-tight text-zinc-900 dark:text-zinc-50">
            {result.session} · {result.semester === "FIRST" ? "First" : "Second"} semester
          </p>
          <p className="text-xs text-zinc-500">
            {result.level} Level · {result.courses.length} course{result.courses.length === 1 ? "" : "s"} · {result.units} units
            {cgpaAfter != null && <> · CGPA after: <b>{cgpaAfter.toFixed(2)}</b></>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">GPA</p>
          <p className={cn("text-2xl font-black font-cabin", tone?.text)}>{result.gpa?.toFixed(2) ?? "–"}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <ul className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
            {result.courses.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{c.courseCode}</p>
                  {c.courseTitle && <p className="text-[11px] text-zinc-500 truncate">{c.courseTitle}</p>}
                </div>
                <span className="text-xs text-zinc-500">{c.units} units</span>
                <span className={cn("w-8 text-center py-1 rounded-lg text-sm font-black font-cabin", GRADE_PILL[c.grade])}>{c.grade}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 pt-1">
            <SlipControl result={result} />
            <button onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SemesterList({ data, onEdit }: { data: Grades; onEdit: (s: SemesterResult) => void }) {
  const cgpaAfter = new Map(data.summary.timeline.map((t) => [`${t.session}|${t.semester}`, t.cgpa]));
  // Newest first
  const semesters = [...data.semesters].reverse();

  return (
    <div className="space-y-3">
      {semesters.map((s) => (
        <SemesterCard key={s.id} result={s} cgpaAfter={cgpaAfter.get(`${s.session}|${s.semester}`) ?? null} onEdit={() => onEdit(s)} />
      ))}
    </div>
  );
}
