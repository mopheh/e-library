"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookPlus, ChevronDown, Loader2, Plus } from "lucide-react";
import { quickCreateCourse } from "@/actions/course";
import { cn } from "@/lib/utils";
import {
  COURSE_LEVELS,
  courseSchema,
  fieldErrors,
  levelFromCode,
  normalizeCourseCode,
  normalizeCourseTitle,
  type CourseField,
} from "@/lib/validation/contribution";

const SEMESTERS = [
  { value: "FIRST", label: "First" },
  { value: "SECOND", label: "Second" },
] as const;
const UNITS = [1, 2, 3, 4, 5, 6];

type Level = (typeof COURSE_LEVELS)[number];
type Semester = (typeof SEMESTERS)[number]["value"];
type Errors = Partial<Record<CourseField, string>>;

const fieldClass =
  "w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 transition-shadow";
const miniLabel = "text-[10px] font-semibold text-zinc-500 dark:text-zinc-400";
const errorRing = "border-red-400 ring-2 ring-red-500/15 dark:border-red-800";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[11px] leading-snug text-red-500">
      {message}
    </p>
  );
}

/**
 * Inline "add the missing course" panel for the contribute form. Lives inside
 * UploadBookForm's <form>, so it can't be a <form> itself: it submits on a
 * type="button" click / Enter key instead.
 */
export function QuickAddCourse({
  departmentId,
  departmentName,
  defaultOpen,
  initialQuery,
  onAdded,
}: {
  departmentId: string;
  departmentName: string;
  /** Open straight away, e.g. when the department has no courses at all. */
  defaultOpen?: boolean;
  /** What the user was searching the course list for; seeds the code or title. */
  initialQuery?: string;
  onAdded: (course: { id: string; courseCode: string; title: string }) => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(!!defaultOpen);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  // Fields the user has left at least once: their errors show while typing.
  const [touched, setTouched] = useState<Partial<Record<CourseField, boolean>>>({});
  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [semester, setSemester] = useState<Semester>("FIRST");
  const [unitLoad, setUnitLoad] = useState(2);

  const values = { courseCode, title, level, semester, unitLoad, departmentId };
  const validate = (v = values): Errors => {
    const r = courseSchema.safeParse(v);
    return r.success ? {} : fieldErrors<CourseField>(r.error);
  };
  const shown = (f: CourseField) => (touched[f] ? errors[f] : undefined);

  // Re-validate live once a field has been touched, so errors clear as soon as they're fixed.
  const update = (patch: Partial<typeof values>) => {
    const next = { ...values, ...patch };
    setErrors(validate(next));
    setError("");
  };
  const touch = (f: CourseField) => {
    setTouched((t) => ({ ...t, [f]: true }));
    setErrors(validate());
  };

  const onCodeChange = (raw: string) => {
    const code = raw.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 8);
    setCourseCode(code);
    // The first digit of a code is its level (CSC 201 → 200), so pick it for them.
    const implied = levelFromCode(code);
    if (implied) setLevel(implied);
    update({ courseCode: code, ...(implied && { level: implied }) });
  };

  const save = async () => {
    if (saving) return;
    const found = validate();
    setErrors(found);
    setTouched({ courseCode: true, title: true, level: true, semester: true, unitLoad: true });
    if (Object.keys(found).length) return;

    setSaving(true);
    setError("");
    const res = await quickCreateCourse({ ...values, level: level as Level });
    setSaving(false);

    if (!res.ok) {
      if (res.fieldErrors && Object.keys(res.fieldErrors).length) setErrors(res.fieldErrors);
      else setError(res.error);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["courses"] });
    onAdded(res.course);
    toast.success(
      res.outcome === "created"
        ? `${res.course.courseCode} added to ${departmentName}`
        : res.outcome === "linked"
          ? `${res.course.courseCode} already existed, so it's now shared with ${departmentName}`
          : `${res.course.courseCode} was already here, so we selected it`,
    );
    setCourseCode("");
    setTitle("");
    setLevel("");
    setErrors({});
    setTouched({});
    setOpen(false);
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Don't let Enter submit the surrounding upload form.
      e.preventDefault();
      save();
    }
  };

  const expand = () => {
    const q = initialQuery?.trim();
    if (q && !courseCode && !title) {
      // "csc 201" looks like a code; anything else is probably a title.
      if (/^[a-z]{3,4}\s?\d/i.test(q)) onCodeChange(normalizeCourseCode(q));
      else setTitle(q);
    }
    setOpen(true);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={expand}
        className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <Plus className="w-3.5 h-3.5" /> Can&apos;t find your course? Add it
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BookPlus className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Add a course</p>
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            It&apos;ll be added to {departmentName} and selected for this upload.
          </p>
        </div>
        {!defaultOpen && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label="Hide add course"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-2">
        <label className="space-y-1">
          <span className={miniLabel}>Course code</span>
          <input
            value={courseCode}
            onChange={(e) => onCodeChange(e.target.value)}
            onBlur={() => {
              const code = normalizeCourseCode(courseCode);
              setCourseCode(code);
              touch("courseCode");
            }}
            onKeyDown={onEnter}
            placeholder="CSC 201"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={8}
            aria-invalid={!!shown("courseCode")}
            className={cn(fieldClass, "uppercase font-semibold tracking-wide", shown("courseCode") && errorRing)}
          />
          <FieldError message={shown("courseCode")} />
        </label>
        <label className="space-y-1">
          <span className={miniLabel}>Course title</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              update({ title: e.target.value });
            }}
            onBlur={() => {
              // Show them the tidied version we'll actually save.
              const t = normalizeCourseTitle(title);
              setTitle(t);
              touch("title");
            }}
            onKeyDown={onEnter}
            placeholder="Introduction to Programming"
            maxLength={100}
            aria-invalid={!!shown("title")}
            className={cn(fieldClass, shown("title") && errorRing)}
          />
          <FieldError message={shown("title")} />
        </label>
      </div>

      <div className="mt-3 space-y-1">
        <span className={miniLabel}>Level</span>
        <div className="grid grid-cols-6 gap-1.5">
          {COURSE_LEVELS.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => {
                setLevel(l);
                setTouched((t) => ({ ...t, level: true }));
                update({ level: l });
              }}
              aria-pressed={level === l}
              className={cn(
                "rounded-lg border py-2 text-xs font-semibold transition-colors",
                level === l
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                shown("level") && level !== l && "border-red-300 dark:border-red-900/60",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <FieldError message={shown("level")} />
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
        <div className="space-y-1">
          <span className={miniLabel}>Semester</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            {SEMESTERS.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => {
                  setSemester(s.value);
                  update({ semester: s.value });
                }}
                aria-pressed={semester === s.value}
                className={cn(
                  "rounded-lg py-1.5 text-xs font-semibold transition-colors",
                  semester === s.value
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <label className="space-y-1">
          <span className={miniLabel}>Units</span>
          <select
            value={unitLoad}
            onChange={(e) => {
              setUnitLoad(Number(e.target.value));
              update({ unitLoad: Number(e.target.value) });
            }}
            className={cn(fieldClass, "py-2")}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u} {u === 1 ? "unit" : "units"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 text-[11px] text-red-500">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {saving ? "Adding…" : "Add course"}
      </button>
    </div>
  );
}
