"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, CheckCircle, Circle, Loader2, BookOpen, AlertTriangle, Filter } from "lucide-react";
import { toast } from "sonner";

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
  explanation?: string | null;
  createdAt: string;
  options: Option[];
}

interface Course {
  id: string;
  courseCode: string;
  title: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const emptyOption = (): Option => ({ optionText: "", isCorrect: false });
const defaultForm = () => ({
  courseId: "",
  questionText: "",
  explanation: "",
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
});

// ─── Question Form Modal ───────────────────────────────────────────────
function QuestionFormModal({
  open, onClose, onSaved, initial, courses
}: {
  open: boolean; onClose: () => void; onSaved: () => void; initial?: Question | null; courses: Course[];
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState(defaultForm());
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
      setForm(defaultForm());
    }
  }, [initial, open]);

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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 bg-white rounded-[2rem] p-8 shadow-2xl w-full max-w-md text-center">
        <h3 className="text-lg font-black font-cabin text-zinc-900 mb-2">Delete Question?</h3>
        <p className="text-sm text-zinc-500 mb-8">This will permanently remove the question. Cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-zinc-100 text-zinc-600">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-red-600 text-white">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CourseCbtQuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(setCourses).catch(() => {});
  }, []);

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(courseId && { courseId }), ...(search && { search }) });
      const res = await fetch(`/api/admin/course-cbt?${params}`);
      const data = await res.json();
      if (data.success) { setQuestions(data.questions); setPagination(data.pagination); }
    } catch { toast.error("Failed to load questions"); } finally { setLoading(false); }
  }, [courseId, search]);

  useEffect(() => { fetchQuestions(1); }, [fetchQuestions]);

  const courseLabel = (id: string) => courses.find(c => c.id === id)?.courseCode || id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">Course Database</p>
          <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Course CBT Manager</h2>
        </div>
        <button onClick={() => { setEditingQuestion(null); setFormOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-white font-black font-cabin text-[10px] uppercase shadow-md"><Plus className="w-3.5 h-3.5" /> Add Question</button>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select value={courseId} onChange={e => setCourseId(e.target.value)} className="text-sm font-poppins bg-zinc-50 border px-3 py-2 rounded-xl outline-none">
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode}</option>)}
          </select>
        </div>
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search questions…" className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-50 text-sm border outline-none" />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-zinc-900 text-white">Search</button>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden border">
        <div className="divide-y min-h-[320px]">
          {loading ? (
             <div className="p-8 text-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center text-zinc-400">No questions found</div>
          ) : (
            questions.map(q => (
              <div key={q.id} className="grid grid-cols-[1fr_120px_80px_100px] px-8 py-5 gap-4 items-center hover:bg-zinc-50 group">
                <p className="text-sm text-zinc-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                <span className="text-[10px] font-black uppercase bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-center">{courseLabel(q.courseId)}</span>
                <span className="text-sm font-black text-center text-zinc-500">{q.options.length}</span>
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => { setEditingQuestion(q); setFormOpen(true); }} className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeletingQuestion(q)} className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))
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

      <QuestionFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => fetchQuestions(pagination.page)} initial={editingQuestion} courses={courses} />
      {deletingQuestion && <DeleteDialog question={deletingQuestion} onClose={() => setDeletingQuestion(null)} onDeleted={() => fetchQuestions(pagination.page)} />}
    </div>
  );
}
