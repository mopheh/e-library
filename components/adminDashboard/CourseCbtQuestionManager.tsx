"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, CheckCircle,
  Circle, Loader2, BookOpen, AlertTriangle, Filter, ArrowLeft, Clock,
  FileQuestion, Layers, ShieldAlert, Hourglass,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useDepartments } from "@/hooks/useDepartments";

// ── Types ─────────────────────────────────────────────────────────────
interface Option {
  id?: string;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  courseId: string;
  questionText: string;
  type: string;
  explanation?: string | null;
  createdAt: string;
  options: Option[];
}

interface Course {
  id: string;
  courseCode: string;
  title: string;
}

interface CourseSummary {
  id: string;
  courseCode: string;
  title: string;
  level: string;
  department: string;
  questionCount: number;
  bookCount: number;
  hasPendingBook: boolean;
  hasNeedsReviewBook: boolean;
  hasProcessingBook: boolean;
  latestQuestionAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const emptyOption = (): Option => ({ optionText: "", isCorrect: false });
const defaultForm = (courseId = "") => ({
  courseId,
  questionText: "",
  explanation: "",
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
});

const relTime = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? "—" : formatDistanceToNow(d, { addSuffix: true });
};

// ─── Question Form Modal ───────────────────────────────────────────────
function QuestionFormModal({
  open, onClose, onSaved, initial, courses, defaultCourseId,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; initial?: Question | null; courses: Course[]; defaultCourseId?: string;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState(defaultForm(defaultCourseId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        courseId: initial.courseId,
        questionText: initial.questionText,
        explanation: initial.explanation ?? "",
        options: initial.options.length > 0 ? initial.options.map(o => ({ id: o.id, optionText: o.optionText, isCorrect: o.isCorrect })) : [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
      });
    } else {
      setForm(defaultForm(defaultCourseId));
    }
  }, [initial, open, defaultCourseId]);

  const setOption = (i: number, field: keyof Option, value: string | boolean) => {
    setForm(prev => {
      const options = prev.options.map((o, idx) => {
        if (idx === i) return { ...o, [field]: value };
        if (field === "isCorrect" && value === true) return { ...o, isCorrect: false };
        return o;
      });
      return { ...prev, options };
    });
  };

  const addOption = () => { if (form.options.length < 6) setForm(p => ({ ...p, options: [...p.options, emptyOption()] })); };
  const removeOption = (i: number) => { if (form.options.length > 2) setForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) })); };

  const handleSubmit = async () => {
    if (!form.courseId) return toast.error("Course is required");
    if (!form.questionText.trim()) return toast.error("Question text is required");
    if (!form.options.some(o => o.isCorrect)) return toast.error("Mark at least one option as correct");
    if (form.options.some(o => !o.optionText.trim())) return toast.error("All option fields must be filled in");

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/course-cbt/${initial!.id}` : "/api/admin/course-cbt";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: form.courseId,
          questionText: form.questionText.trim(),
          explanation: form.explanation?.trim() || null,
          options: form.options.map(o => ({ optionText: o.optionText.trim(), isCorrect: o.isCorrect })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success(isEdit ? "Question updated!" : "Question created!");
      onSaved(); onClose();
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-8 pt-8 pb-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">{isEdit ? "Edit" : "New"} Question</p>
              <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Course CBT Manager</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"><X className="w-4 h-4 text-zinc-500" /></button>
          </div>
          <div className="px-8 py-6 space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">Course</label>
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm font-poppins text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 ring-indigo-500/30 transition">
                <option value="">Select a Course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">Question Text</label>
              <textarea value={form.questionText} onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))} rows={4} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm font-poppins text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">Explanation <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span></label>
              <textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} rows={2} className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm font-poppins text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 outline-none resize-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin">Answer Options</label></div>
              <div className="space-y-3">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button type="button" onClick={() => setOption(i, "isCorrect", !opt.isCorrect)} className="shrink-0">
                      {opt.isCorrect ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-zinc-300" />}
                    </button>
                    <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-cabin ${opt.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{String.fromCharCode(65 + i)}</span>
                    <input type="text" value={opt.optionText} onChange={e => setOption(i, "optionText", e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none bg-zinc-50 dark:bg-zinc-800" />
                    {form.options.length > 2 && <button type="button" onClick={() => removeOption(i)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
              </div>
              {form.options.length < 6 && <button type="button" onClick={addOption} className="mt-3 flex items-center gap-2 text-[11px] font-black font-cabin uppercase text-indigo-500"><Plus className="w-3.5 h-3.5" /> Add Option</button>}
            </div>
          </div>
          <div className="sticky bottom-0 z-10 flex justify-end gap-3 px-8 py-6 bg-white dark:bg-zinc-900 border-t border-zinc-100">
            <button onClick={onClose} className="px-5 py-2.5 rounded-2xl text-sm font-black font-cabin text-zinc-500">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-zinc-900 text-white text-sm font-black font-cabin disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {isEdit ? "Save Changes" : "Create Question"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DeleteDialog({ question, onClose, onDeleted }: { question: Question | null; onClose: () => void; onDeleted: () => void; }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!question) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/course-cbt/${question.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success("Question deleted"); onDeleted(); onClose();
    } catch (e: any) { toast.error(e.message || "Network error"); } finally { setDeleting(false); }
  };
  if (!question) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl w-full max-w-md text-center">
        <h3 className="text-lg font-black font-cabin text-zinc-900 dark:text-zinc-50 mb-2">Delete Question?</h3>
        <p className="text-sm text-zinc-500 mb-8">This will permanently remove the question. Cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-zinc-100 text-zinc-600">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-red-600 text-white">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteAllDialog({ course, onClose, onDeleted }: { course: CourseSummary | null; onClose: () => void; onDeleted: () => void; }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!course) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/course-cbt?courseId=${course.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      toast.success(`Deleted ${data.deletedCount} question${data.deletedCount === 1 ? "" : "s"}`);
      onDeleted(); onClose();
    } catch (e: any) { toast.error(e.message || "Network error"); } finally { setDeleting(false); }
  };
  if (!course) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-black font-cabin text-zinc-900 dark:text-zinc-50 mb-2">
          Delete all {course.questionCount} question{course.questionCount === 1 ? "" : "s"} for {course.courseCode}?
        </h3>
        <p className="text-sm text-zinc-500 mb-8">This removes every CBT question generated for this course. Cannot be undone - use this before a source book gets reparsed/regenerated.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-zinc-100 text-zinc-600">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-red-600 text-white disabled:opacity-60">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete All"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Quality badges (shared between course card + question-list header) ──
function QualityBadges({ course }: { course: CourseSummary }) {
  if (!course.hasPendingBook && !course.hasNeedsReviewBook && !course.hasProcessingBook) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {course.hasPendingBook && (
        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertTriangle className="w-2.5 h-2.5" /> Unreviewed source
        </span>
      )}
      {course.hasNeedsReviewBook && (
        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <ShieldAlert className="w-2.5 h-2.5" /> OCR review needed
        </span>
      )}
      {course.hasProcessingBook && (
        <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Hourglass className="w-2.5 h-2.5" /> Still processing
        </span>
      )}
    </div>
  );
}

// ─── Course overview (default landing view) ───────────────────────────
function CourseOverview({ onSelectCourse }: { onSelectCourse: (c: CourseSummary) => void }) {
  const [summaries, setSummaries] = useState<CourseSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const { data: departments } = useDepartments({ limit: 1000 });

  const fetchSummaries = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: "50",
        ...(search && { search }),
        ...(departmentId && { departmentId }),
      });
      const res = await fetch(`/api/admin/course-cbt/courses?${params}`);
      const data = await res.json();
      if (data.success) { setSummaries(data.courses); setPagination(data.pagination); }
    } catch { toast.error("Failed to load course overview"); } finally { setLoading(false); }
  }, [search, departmentId]);

  useEffect(() => { fetchSummaries(1); }, [fetchSummaries]);

  const totalQuestions = summaries.reduce((sum, c) => sum + c.questionCount, 0);
  const flaggedCount = summaries.filter(c => c.hasNeedsReviewBook || c.hasPendingBook).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1">Courses w/ Questions</p>
          <p className="text-2xl font-black font-cabin text-zinc-900 dark:text-zinc-50">{pagination.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1">Questions (this page)</p>
          <p className="text-2xl font-black font-cabin text-zinc-900 dark:text-zinc-50">{totalQuestions}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-5 border shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1">Flagged Sources</p>
          <p className="text-2xl font-black font-cabin text-amber-600">{flaggedCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="text-sm font-poppins bg-zinc-50 dark:bg-zinc-900 border px-3 py-2 rounded-xl outline-none">
            <option value="">All Departments</option>
            {(departments ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search courses…" className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-sm border outline-none" />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-zinc-900 text-white">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="p-16 text-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : summaries.length === 0 ? (
        <div className="p-16 text-center text-zinc-400 bg-white dark:bg-zinc-950 rounded-[2rem] border">
          No courses with generated questions yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaries.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectCourse(c)}
              className="text-left bg-white dark:bg-zinc-950 rounded-[1.75rem] p-6 border shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 font-cabin mb-0.5">{c.courseCode} · Level {c.level}</p>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-2">{c.title}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{c.department}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black font-cabin text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-500 transition-colors">{c.questionCount}</p>
                  <p className="text-[9px] font-bold uppercase text-zinc-400">questions</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <QualityBadges course={c} />
                <span className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-400">
                  <BookOpen className="w-3 h-3" /> {c.bookCount} book{c.bookCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2">
                <Clock className="w-3 h-3" /> Last generated {relTime(c.latestQuestionAt)}
              </div>
            </button>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-between px-2">
          <button onClick={() => fetchSummaries(pagination.page - 1)} disabled={pagination.page === 1} className="flex items-center gap-1 text-[10px] font-black uppercase text-zinc-400 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /> Prev</button>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => fetchSummaries(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="flex items-center gap-1 text-[10px] font-black uppercase text-zinc-400 disabled:opacity-30">Next <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}

// ─── Question list, scoped to one course ──────────────────────────────
function CourseQuestionList({ course, allCourses, onBack }: { course: CourseSummary; allCourses: Course[]; onBack: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", courseId: course.id, ...(search && { search }) });
      const res = await fetch(`/api/admin/course-cbt?${params}`);
      const data = await res.json();
      if (data.success) { setQuestions(data.questions); setPagination(data.pagination); }
    } catch { toast.error("Failed to load questions"); } finally { setLoading(false); }
  }, [course.id, search]);

  useEffect(() => { fetchQuestions(1); }, [fetchQuestions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 font-cabin mb-1.5">
            <ArrowLeft className="w-3 h-3" /> All Courses
          </button>
          <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 truncate">{course.courseCode} — {course.title}</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">{course.department} · Level {course.level} · {pagination.total} question{pagination.total === 1 ? "" : "s"} from {course.bookCount} book{course.bookCount === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setDeletingAll(true)} disabled={course.questionCount === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 font-black font-cabin text-[10px] uppercase disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /> Delete All</button>
          <button onClick={() => { setEditingQuestion(null); setFormOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white font-black font-cabin text-[10px] uppercase shadow-md"><Plus className="w-3.5 h-3.5" /> Add Question</button>
        </div>
      </div>

      <QualityBadges course={course} />

      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search this course's questions…" className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-white dark:bg-zinc-950 text-sm border outline-none" />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-zinc-900 text-white">Search</button>
      </form>

      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden border">
        <div className="divide-y min-h-[320px]">
          {loading ? (
            <div className="p-8 text-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">No questions found</div>
          ) : (
            questions.map(q => {
              const correct = q.options.find(o => o.isCorrect);
              return (
                <div key={q.id} className="px-8 py-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">{q.questionText}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1 uppercase font-bold"><FileQuestion className="w-3 h-3" /> {q.type || "mcq"}</span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {q.options.length} options</span>
                        {correct && <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[220px]">✓ {correct.optionText}</span>}
                        {!q.explanation && <span className="text-zinc-300 dark:text-zinc-600">no explanation</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {relTime(q.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 shrink-0">
                      <button onClick={() => { setEditingQuestion(q); setFormOpen(true); }} className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingQuestion(q)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {pagination.totalPages > 1 && (
          <div className="flex justify-between px-8 py-5 border-t">
            <button onClick={() => fetchQuestions(pagination.page - 1)} disabled={pagination.page === 1} className="text-[10px] font-black uppercase text-zinc-400 disabled:opacity-30">Prev</button>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Page {pagination.page} of {pagination.totalPages}</span>
            <button onClick={() => fetchQuestions(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="text-[10px] font-black uppercase text-zinc-400 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>

      <QuestionFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => fetchQuestions(pagination.page)} initial={editingQuestion} courses={allCourses} defaultCourseId={course.id} />
      {deletingQuestion && <DeleteDialog question={deletingQuestion} onClose={() => setDeletingQuestion(null)} onDeleted={() => fetchQuestions(pagination.page)} />}
      {deletingAll && <DeleteAllDialog course={course} onClose={() => setDeletingAll(false)} onDeleted={onBack} />}
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────
export default function CourseCbtQuestionManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseSummary | null>(null);

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(setCourses).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {!selectedCourse && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">Course Database</p>
          <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Course CBT Manager</h2>
        </div>
      )}

      {selectedCourse ? (
        <CourseQuestionList course={selectedCourse} allCourses={courses} onBack={() => setSelectedCourse(null)} />
      ) : (
        <CourseOverview onSelectCourse={setSelectedCourse} />
      )}
    </div>
  );
}
