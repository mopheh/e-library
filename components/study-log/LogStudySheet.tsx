"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BookOpen, FileQuestion, Minus, MoreHorizontal, NotebookPen, Plus, Users } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { lagosDate } from "@/lib/time";
import { useEnrolledCourses } from "@/hooks/useEnrolledCourses";
import { type StudyMethod, useDeleteStudyLog, useLogStudy } from "@/hooks/useStudyLogs";

export const STUDY_METHODS: { value: StudyMethod; label: string; icon: React.ElementType }[] = [
  { value: "TEXTBOOK", label: "Textbook", icon: BookOpen },
  { value: "NOTES", label: "Lecture notes", icon: NotebookPen },
  { value: "PAST_QUESTIONS", label: "Past questions", icon: FileQuestion },
  { value: "GROUP", label: "Group study", icon: Users },
  { value: "OTHER", label: "Other", icon: MoreHorizontal },
];

const DURATIONS = [15, 30, 45, 60, 90, 120, 180];
const MAX_BACKDATE_DAYS = 7;

export function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

function recentDays() {
  const days: { value: string; label: string }[] = [];
  for (let i = 0; i <= MAX_BACKDATE_DAYS; i++) {
    const d = new Date(Date.now() - i * 86_400_000);
    const value = lagosDate(d);
    const label =
      i === 0 ? "Today" : i === 1 ? "Yesterday" :
      new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "Africa/Lagos" }).format(d);
    days.push({ value, label });
  }
  return days;
}

function Chip({ active, onClick, children, className }: {
  active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shrink-0",
        active
          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 font-cabin">
        {label}
        {hint && <span className="normal-case tracking-normal font-medium text-zinc-400"> · {hint}</span>}
      </p>
      {children}
    </div>
  );
}

function LogStudySheet({ open, onOpenChange, initialCourseId }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCourseId?: string;
}) {
  const { data: courses, isLoading: coursesLoading } = useEnrolledCourses();
  const logStudy = useLogStudy();
  const deleteLog = useDeleteStudyLog();

  const [courseId, setCourseId] = useState<string | null>(null);
  const [timesRead, setTimesRead] = useState(1);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [method, setMethod] = useState<StudyMethod>("TEXTBOOK");
  const [date, setDate] = useState(() => lagosDate());
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  // Recomputed per open so "Today" is right even if the tab sat overnight
  const days = useMemo(() => recentDays(), [open]);

  // Reset only when the sheet opens - not when courses refetch mid-edit
  useEffect(() => {
    if (!open) return;
    setCourseId(initialCourseId ?? null);
    setTimesRead(1);
    setMinutes(null);
    setDate(lagosDate());
    setNote("");
    setShowNote(false);
    // method is kept between logs - students tend to study the same way
  }, [open, initialCourseId]);

  // Only one course? Pre-select it (courses may arrive after opening)
  useEffect(() => {
    if (open && courses?.length === 1) setCourseId((id) => id ?? courses[0].id);
  }, [open, courses]);

  const selected = courses?.find((c) => c.id === courseId);

  const submit = async () => {
    if (!courseId) return;
    try {
      const log = await logStudy.mutateAsync({
        courseId, date, timesRead, minutes, method, note: note.trim() || undefined,
      });
      onOpenChange(false);
      const parts = [`${timesRead}×`, minutes ? formatMinutes(minutes) : null].filter(Boolean).join(" · ");
      toast.success(`Logged ${log.courseCode}`, {
        description: `${parts}${date === lagosDate() ? "" : ` on ${days.find((d) => d.value === date)?.label}`}`,
        action: {
          label: "Undo",
          onClick: () => deleteLog.mutate(log.id, { onError: () => toast.error("Couldn't undo that log") }),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your log");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[120] mx-auto w-full max-w-lg max-h-[92dvh] rounded-t-[28px] sm:bottom-4 sm:rounded-[28px] border-zinc-200 dark:border-zinc-800 p-0 gap-0 font-poppins"
      >
        {/* grab handle */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" />

        <SheetHeader className="px-5 pt-4 pb-2">
          <SheetTitle className="font-cabin font-black text-xl tracking-tight">Log study</SheetTitle>
          <SheetDescription className="text-xs">
            Studied outside the app? Record it so it counts toward your streak and course progress.
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-5 pb-4 space-y-5">
          <Section label="Course">
            {coursesLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : courses && courses.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {courses.map((c) => (
                    <Chip key={c.id} active={c.id === courseId} onClick={() => setCourseId(c.id)}>
                      {c.courseCode}
                    </Chip>
                  ))}
                </div>
                {/* Always rendered so picking a course doesn't push the form down mid-tap */}
                <p className="text-xs text-zinc-500 truncate h-4">{selected?.title ?? ""}</p>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                You haven&apos;t registered any courses yet.{" "}
                <Link href="/dashboard" onClick={() => onOpenChange(false)} className="font-semibold text-indigo-600">
                  Register your courses
                </Link>{" "}
                to start logging.
              </p>
            )}
          </Section>

          <Section label="How many times?">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer"
                onClick={() => setTimesRead((n) => Math.max(1, n - 1))}
                disabled={timesRead <= 1}
                className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center disabled:opacity-40 active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="min-w-24 text-center">
                <span className="text-2xl font-black font-cabin">{timesRead}</span>
                <span className="text-xs text-zinc-500 ml-1">{timesRead === 1 ? "time" : "times"}</span>
              </div>
              <button
                type="button"
                aria-label="More"
                onClick={() => setTimesRead((n) => Math.min(10, n + 1))}
                disabled={timesRead >= 10}
                className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center disabled:opacity-40 active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Section>

          <Section label="Time spent" hint="optional">
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
              {DURATIONS.map((m) => (
                <Chip key={m} active={minutes === m} onClick={() => setMinutes(minutes === m ? null : m)}>
                  {formatMinutes(m)}
                </Chip>
              ))}
            </div>
          </Section>

          <Section label="How did you study?">
            <div className="flex flex-wrap gap-2">
              {STUDY_METHODS.map(({ value, label, icon: Icon }) => (
                <Chip key={value} active={method === value} onClick={() => setMethod(value)}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section label="When?">
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
              {days.map((d) => (
                <Chip key={d.value} active={date === d.value} onClick={() => setDate(d.value)}>
                  {d.label}
                </Chip>
              ))}
            </div>
          </Section>

          {showNote ? (
            <Section label="Note" hint="optional">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 280))}
                rows={2}
                autoFocus
                placeholder="e.g. Chapter 3, integration by parts"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </Section>
          ) : (
            <button type="button" onClick={() => setShowNote(true)} className="text-xs font-semibold text-indigo-600">
              + Add a note
            </button>
          )}
        </div>

        <div className="px-5 pt-3 border-t border-zinc-100 dark:border-zinc-800"
             style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={submit}
            disabled={!courseId || logStudy.isPending}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-black font-cabin uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-colors"
          >
            {logStudy.isPending ? "Saving…" : selected ? `Log ${selected.courseCode}` : "Choose a course"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const StudyLogContext = createContext<{ openLogStudy: (courseId?: string) => void } | null>(null);

/** Mount once (protected layout); any component can then open the sheet. */
export function StudyLogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ open: boolean; courseId?: string }>({ open: false });
  const openLogStudy = useCallback((courseId?: string) => setState({ open: true, courseId }), []);
  const value = useMemo(() => ({ openLogStudy }), [openLogStudy]);

  return (
    <StudyLogContext.Provider value={value}>
      {children}
      <LogStudySheet
        open={state.open}
        initialCourseId={state.courseId}
        onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      />
    </StudyLogContext.Provider>
  );
}

export function useLogStudySheet() {
  const ctx = useContext(StudyLogContext);
  if (!ctx) throw new Error("useLogStudySheet must be used inside StudyLogProvider");
  return ctx;
}
