"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity, AlertTriangle, ArrowDownUp, BookOpen, ChevronLeft, ChevronRight, ClipboardList, Clock,
  GraduationCap, Loader2, Search, TrendingDown, UserX, Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsDarkMode } from "@/components/is-dark";
import { useFaculties } from "@/hooks/useFaculties";
import { useDepartments } from "@/hooks/useDepartments";
import { cn } from "@/lib/utils";
import { DEGREE_CLASSES } from "@/lib/grading";
import type { performanceOverview, performanceStudents, studentPerformanceDetail, RiskFlag, StudentSort } from "@/lib/student-performance";
import { formatMinutes } from "@/components/study-log/LogStudySheet";
import { BAND } from "@/components/progress/Readiness";

type Overview = Awaited<ReturnType<typeof performanceOverview>>;
type StudentsPage = Awaited<ReturnType<typeof performanceStudents>>;
type Detail = NonNullable<Awaited<ReturnType<typeof studentPerformanceDetail>>>;

// Validated with the dataviz palette script on light + dark surfaces
// (same pair as the student GPA chart). Identity also carries via the
// legend and stack order, never colour alone.
const APP_COLOR = "#6366f1";
const LOGGED_COLOR = "#059669";

const LEVELS = ["100", "200", "300", "400", "500", "600"];
const METHOD_LABEL: Record<string, string> = {
  TEXTBOOK: "Textbook", NOTES: "Lecture notes", PAST_QUESTIONS: "Past questions", GROUP: "Group study", OTHER: "Other",
};
const CLASS_LABEL = Object.fromEntries(DEGREE_CLASSES.map((c) => [c.key, c.label]));

// Status flags: icon + label + colour (never colour alone)
const FLAG: Record<RiskFlag, { label: string; icon: React.ElementType; cls: string }> = {
  LOW_CGPA: { label: "CGPA < 2.40", icon: TrendingDown, cls: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
  INACTIVE: { label: "Inactive 14d", icon: UserX, cls: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  LOW_CBT: { label: "CBT < 40%", icon: AlertTriangle, cls: "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
};

const card = "bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800/60 shadow-sm";
const label = "text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin";
const select = "px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-zinc-100 min-w-0";

function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "" && v !== false) p.set(k, String(v === true ? 1 : v));
  return p.toString();
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

function useChartTheme() {
  const dark = useIsDarkMode();
  return {
    ink: dark ? "#a1a1aa" : "#71717a",
    grid: dark ? "#27272a" : "#f4f4f5",
    surface: dark ? "#18181b" : "#ffffff",
    text: dark ? "#e4e4e7" : "#27272a",
  };
}

function Kpi({ icon: Icon, title, value, sub }: { icon: React.ElementType; title: string; value: string; sub?: string }) {
  return (
    <div className={cn(card, "p-5")}>
      <Icon className="w-4 h-4 text-indigo-600 mb-3" />
      <p className="text-2xl font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className={label}>{title}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function FlagChips({ flags }: { flags: RiskFlag[] }) {
  if (!flags.length) return <span className="text-[11px] text-zinc-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => {
        const { label: text, icon: Icon, cls } = FLAG[f];
        return (
          <span key={f} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap", cls)}>
            <Icon className="w-3 h-3" /> {text}
          </span>
        );
      })}
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────

function StudyTrendChart({ data }: { data: Overview["trend"] }) {
  const t = useChartTheme();
  const rows = data.map((d) => ({ ...d, label: d.date.slice(5).replace("-", "/") }));
  return (
    <div className={cn(card, "p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className={label}>Study time · last 30 days</p>
          <p className="text-xs text-zinc-500 mt-0.5">Total minutes across all students in scope</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: APP_COLOR }} /> In-app reading</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: LOGGED_COLOR }} /> Logged study</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={t.grid} />
            <XAxis dataKey="label" tick={{ fill: t.ink, fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: t.ink, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(127,127,127,0.08)" }}
              contentStyle={{ background: t.surface, border: `1px solid ${t.grid}`, borderRadius: 12, fontSize: 12, color: t.text }}
              formatter={(v, name) => [formatMinutes(Number(v)), name === "appMinutes" ? "In-app reading" : "Logged study"]}
              labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.activeStudents ?? 0} active students`}
            />
            <Bar dataKey="appMinutes" stackId="m" fill={APP_COLOR} stroke={t.surface} strokeWidth={1} />
            <Bar dataKey="loggedMinutes" stackId="m" fill={LOGGED_COLOR} stroke={t.surface} strokeWidth={1} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Single-measure horizontal bars with direct value labels (no legend needed). */
function RankBars({ title, sub, rows, format = (v: number) => String(v) }: {
  title: string; sub?: string; rows: { name: string; value: number }[]; format?: (v: number) => string;
}) {
  // Plain HTML rather than a recharts vertical BarChart: these cards are
  // ~200px wide, and a category axis eats most of that, leaving the bars a
  // few pixels. Label + value on one line, full-width bar underneath.
  const max = Math.max(...rows.map((r) => r.value), 0);
  return (
    <div className={cn(card, "p-6")}>
      <p className={label}>{title}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5 mb-4">{sub}</p>}
      {max === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">No data yet</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.name} className="group" title={`${r.name}: ${format(r.value)}`}>
              <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400 truncate">{r.name}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">{format(r.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800/70">
                {r.value > 0 && (
                  <div
                    className="h-full rounded-full transition-opacity group-hover:opacity-80"
                    style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: APP_COLOR }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Student detail ────────────────────────────────────────────────────────

function StudentDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const t = useChartTheme();
  const { data, isLoading, isError } = useQuery<Detail>({
    queryKey: ["admin-performance-student", id],
    queryFn: () => getJSON(`/api/admin/performance/students/${id}`),
    enabled: !!id,
  });

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0 font-poppins">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="font-cabin font-black text-xl tracking-tight">{data?.student.fullName ?? "Student"}</SheetTitle>
          {data && (
            <p className="text-xs text-zinc-500">
              {data.student.matricNo} · {data.student.level} Level · {data.student.departmentName}, {data.student.facultyName}
            </p>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
        ) : isError || !data ? (
          <p className="px-6 py-10 text-sm text-rose-600">Couldn&apos;t load this student.</p>
        ) : (
          <div className="px-6 pb-8 space-y-6">
            {/* CGPA */}
            <section className="space-y-2">
              <p className={label}>CGPA</p>
              {data.grades.summary.cgpa != null ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black font-cabin">{data.grades.summary.cgpa.toFixed(2)}</span>
                  <span className="text-sm text-zinc-500">{data.grades.summary.degreeClass?.label} · {data.grades.summary.totalUnits} units</span>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No grades entered.</p>
              )}
              {data.grades.semesters.length > 0 && (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                  {data.grades.semesters.map((s) => (
                    <li key={`${s.session}${s.semester}`} className="flex justify-between py-1.5">
                      <span className="text-zinc-600 dark:text-zinc-300">{s.session} · {s.semester === "FIRST" ? "1st" : "2nd"} sem · {s.level}L</span>
                      <span className="font-semibold">GPA {s.gpa?.toFixed(2) ?? "–"} <span className="text-zinc-400 font-normal">({s.units}u)</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Weekly study */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className={label}>Study time · last 8 weeks</p>
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px]" style={{ background: APP_COLOR }} /> In-app</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px]" style={{ background: LOGGED_COLOR }} /> Logged</span>
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.studyWeeks.map((w) => ({ ...w, label: w.weekOf.slice(5).replace("-", "/") }))} margin={{ top: 4, right: 0, bottom: 0, left: -18 }}>
                    <CartesianGrid vertical={false} stroke={t.grid} />
                    <XAxis dataKey="label" tick={{ fill: t.ink, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.ink, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(127,127,127,0.08)" }}
                      contentStyle={{ background: t.surface, border: `1px solid ${t.grid}`, borderRadius: 12, fontSize: 12, color: t.text }}
                      formatter={(v, name) => [formatMinutes(Number(v)), name === "app" ? "In-app" : "Logged"]}
                      labelFormatter={(l) => `Week of ${l}`}
                    />
                    <Bar dataKey="app" stackId="w" fill={APP_COLOR} stroke={t.surface} strokeWidth={1} />
                    <Bar dataKey="logged" stackId="w" fill={LOGGED_COLOR} stroke={t.surface} strokeWidth={1} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Readiness */}
            {data.readiness.length > 0 && (
              <section className="space-y-2">
                <p className={label}>Exam readiness (this semester)</p>
                <ul className="space-y-1.5 text-sm">
                  {data.readiness.map((r) => {
                    const B = BAND[r.band];
                    return (
                      <li key={r.courseCode} className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{r.courseCode}</span>
                        <span className={cn("inline-flex items-center gap-1 text-xs font-bold", B.text)}>
                          <B.icon className="w-3.5 h-3.5" /> {r.readiness}% · {B.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* CBT */}
            <section className="space-y-2">
              <p className={label}>CBT results by course</p>
              {data.cbt.length === 0 ? (
                <p className="text-sm text-zinc-500">No CBT attempts.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-[10px] uppercase tracking-wider text-zinc-400 text-left"><th className="py-1 font-bold">Course</th><th className="font-bold text-right">Attempts</th><th className="font-bold text-right">Avg</th><th className="font-bold text-right">Best</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data.cbt.map((c) => (
                      <tr key={c.courseCode}><td className="py-1.5 font-semibold">{c.courseCode}</td><td className="text-right">{c.attempts}</td><td className="text-right">{c.avgScore}%</td><td className="text-right">{c.best}%</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Recent logs */}
            <section className="space-y-2">
              <p className={label}>Recent logged study</p>
              {data.recentLogs.length === 0 ? (
                <p className="text-sm text-zinc-500">Nothing logged.</p>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                  {data.recentLogs.map((l, i) => (
                    <li key={i} className="flex justify-between py-1.5 gap-2">
                      <span className="text-zinc-600 dark:text-zinc-300">{l.date} · {l.courseCode}</span>
                      <span className="text-zinc-500 text-right">{l.timesRead}×{l.minutes ? ` · ${formatMinutes(l.minutes)}` : ""} · {METHOD_LABEL[l.method] ?? l.method}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main section ──────────────────────────────────────────────────────────

export default function StudentPerformance() {
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [atRisk, setAtRisk] = useState(false);
  const [sort, setSort] = useState<StudentSort>("risk");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => setPage(1), [facultyId, departmentId, level, debounced, atRisk, sort, dir]);

  const { data: faculties } = useFaculties(1, 100);
  const { data: departments } = useDepartments({ facultyId: facultyId || undefined, limit: 1000 });

  const filters = { facultyId, departmentId, level };
  const overview = useQuery<Overview>({
    queryKey: ["admin-performance", filters],
    queryFn: () => getJSON(`/api/admin/performance?${qs(filters)}`),
    staleTime: 60_000,
  });
  const students = useQuery<StudentsPage>({
    queryKey: ["admin-performance-students", filters, debounced, atRisk, sort, dir, page],
    queryFn: () => getJSON(`/api/admin/performance/students?${qs({ ...filters, search: debounced, atRisk, sort, dir, page })}`),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const k = overview.data?.kpis;
  const facultyList = useMemo(() => (Array.isArray(faculties) ? faculties : (faculties as { faculties?: unknown[] } | undefined)?.faculties ?? []) as { id: string; name: string }[], [faculties]);
  const deptList = (Array.isArray(departments) ? departments : []) as { id: string; name: string }[];

  const sortBy = (s: StudentSort) => {
    if (sort === s) setDir(dir === "asc" ? "desc" : "asc");
    else { setSort(s); setDir(s === "name" ? "asc" : "desc"); }
  };
  const SortTh = ({ s, children, className }: { s: StudentSort; children: React.ReactNode; className?: string }) => (
    <th className={cn("py-3 px-3 font-bold", className)}>
      <button onClick={() => sortBy(s)} className={cn("inline-flex items-center gap-1 uppercase tracking-wider", sort === s && "text-zinc-800 dark:text-zinc-100")}>
        {children} <ArrowDownUp className="w-3 h-3 opacity-60" />
      </button>
    </th>
  );

  return (
    <div className="space-y-8 font-poppins">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className={label}>Faculty</span>
          <select value={facultyId} onChange={(e) => { setFacultyId(e.target.value); setDepartmentId(""); }} className={cn(select, "block w-56")}>
            <option value="">All faculties</option>
            {facultyList.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className={label}>Department</span>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={cn(select, "block w-56")}>
            <option value="">All departments</option>
            {deptList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className={label}>Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={cn(select, "block w-32")}>
            <option value="">All</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}L</option>)}
          </select>
        </label>
        {overview.isFetching && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 mb-3" />}
      </div>

      {overview.isError ? (
        <p className="text-sm text-rose-600">Couldn&apos;t load performance data.</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi icon={Users} title="Students" value={k ? k.students.toLocaleString() : "…"} />
            <Kpi icon={Activity} title="Active (7 / 30 days)" value={k ? `${k.active7} / ${k.active30}` : "…"}
              sub={k && k.students ? `${Math.round((k.active30 / k.students) * 100)}% active this month` : undefined} />
            <Kpi icon={Clock} title="Study / active student" value={k ? `${formatMinutes(k.avgWeeklyMinutesPerActive)}/wk` : "…"} />
            <Kpi icon={AlertTriangle} title="Need attention" value={k ? k.needsAttention.toLocaleString() : "…"}
              sub="Low CGPA, inactive 14 days, or low CBT" />
            <Kpi icon={ClipboardList} title="Avg CBT score" value={k?.avgCbt != null ? `${k.avgCbt}%` : "–"} />
            <Kpi icon={GraduationCap} title="Avg CGPA" value={k?.avgCgpa != null ? k.avgCgpa.toFixed(2) : "–"}
              sub={k ? `${k.withCgpa} of ${k.students} have entered grades` : undefined} />
          </div>

          {/* Patterns */}
          {overview.data && (
            <>
              <StudyTrendChart data={overview.data.trend} />
              <div className="grid lg:grid-cols-3 gap-4">
                <RankBars title="Study by weekday" sub="Minutes, last 8 weeks" format={formatMinutes}
                  rows={overview.data.weekday.map((w) => ({ name: w.day, value: w.minutes }))} />
                <RankBars title="How students study" sub="Logged sessions, last 30 days"
                  rows={overview.data.methods.map((m) => ({ name: METHOD_LABEL[m.method] ?? m.method, value: m.count }))} />
                <RankBars title="Class of degree" sub="Students who entered grades"
                  rows={overview.data.classDistribution.map((c) => ({ name: CLASS_LABEL[c.key] ?? c.key, value: c.count }))} />
              </div>

              {/* Departments */}
              <div className={cn(card, "overflow-hidden")}>
                <div className="p-6 pb-3"><p className={label}>By department</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-zinc-400 text-left border-b border-zinc-100 dark:border-zinc-800">
                        <th className="py-3 px-6 font-bold">Department</th><th className="px-3 font-bold text-right">Students</th>
                        <th className="px-3 font-bold text-right">Active</th><th className="px-3 font-bold text-right">Study/wk</th>
                        <th className="px-3 font-bold text-right">Avg CBT</th><th className="px-3 font-bold text-right">Avg CGPA</th>
                        <th className="px-6 font-bold text-right">Need attention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                      {overview.data.departments.map((d) => (
                        <tr key={d.departmentId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer" onClick={() => setDepartmentId(d.departmentId)}>
                          <td className="py-3 px-6"><p className="font-semibold">{d.departmentName}</p><p className="text-[11px] text-zinc-500">{d.facultyName}</p></td>
                          <td className="px-3 text-right">{d.students}</td>
                          <td className="px-3 text-right">{d.activePct}%</td>
                          <td className="px-3 text-right">{formatMinutes(d.avgWeeklyMinutes)}</td>
                          <td className="px-3 text-right">{d.avgCbt != null ? `${d.avgCbt}%` : "–"}</td>
                          <td className="px-3 text-right">{d.avgCgpa != null ? `${d.avgCgpa.toFixed(2)}` : "–"}<span className="text-[11px] text-zinc-400"> ({d.withCgpa})</span></td>
                          <td className="px-6 text-right">{d.needsAttention}</td>
                        </tr>
                      ))}
                      {overview.data.departments.length === 0 && (
                        <tr><td colSpan={7} className="py-10 text-center text-zinc-500">No students match these filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Students */}
      <div className={cn(card, "overflow-hidden")}>
        <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={label}>Students</p>
            <p className="text-xs text-zinc-500 mt-0.5">Click a student for their full record.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or matric no."
                className={cn(select, "pl-9 w-56 font-normal")} />
            </label>
            <button onClick={() => setAtRisk((v) => !v)} aria-pressed={atRisk}
              className={cn("inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition",
                atRisk ? "bg-rose-600 border-rose-600 text-white" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300")}>
              <AlertTriangle className="w-3.5 h-3.5" /> Needs attention only
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-[10px] text-zinc-400 text-left border-y border-zinc-100 dark:border-zinc-800">
                <SortTh s="name" className="px-6">Student</SortTh>
                <SortTh s="cgpa" className="text-right">CGPA</SortTh>
                <SortTh s="minutes" className="text-right">Study (14d)</SortTh>
                <SortTh s="cbt" className="text-right">CBT avg</SortTh>
                <SortTh s="lastActive">Last active</SortTh>
                <SortTh s="risk" className="px-6">Flags</SortTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {students.data?.students.map((s) => (
                <tr key={s.id} onClick={() => setOpenId(s.id)} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                  <td className="py-3 px-6">
                    <p className="font-semibold">{s.fullName}</p>
                    <p className="text-[11px] text-zinc-500">{s.matricNo} · {s.level}L · {s.departmentName}</p>
                  </td>
                  <td className="px-3 text-right">
                    {s.cgpa != null ? <><span className="font-bold">{s.cgpa.toFixed(2)}</span><p className="text-[10px] text-zinc-400">{CLASS_LABEL[s.degreeClass!]}</p></> : <span className="text-zinc-400">–</span>}
                  </td>
                  <td className="px-3 text-right">{formatMinutes(s.minutes14)}</td>
                  <td className="px-3 text-right">{s.cbtAvg != null ? `${s.cbtAvg}%` : <span className="text-zinc-400">–</span>}<p className="text-[10px] text-zinc-400">{s.cbtAttempts ? `${s.cbtAttempts} recent` : ""}</p></td>
                  <td className="px-3 text-zinc-600 dark:text-zinc-300">{s.lastActive ?? <span className="text-zinc-400">Never</span>}</td>
                  <td className="px-6"><FlagChips flags={s.flags} /></td>
                </tr>
              ))}
              {students.data && students.data.students.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-zinc-500">No students match.</td></tr>
              )}
              {!students.data && (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-400 inline" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {students.data && students.data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
            <span>{students.data.total.toLocaleString()} students</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              <span>Page {students.data.page} of {students.data.totalPages}</span>
              <button disabled={page >= students.data.totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs text-zinc-500">
        <BookOpen className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Study time combines in-app reading and study students log themselves (an untimed logged session counts as 30 min).
        CGPA is self-reported by students on their Grades page. Flags: CGPA below 2.40, no study for 14 days, or CBT average under 40% over at least 2 recent attempts.
      </p>

      <StudentDetail id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
