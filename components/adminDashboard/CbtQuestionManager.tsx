"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Circle,
  Loader2,
  BookOpen,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────
interface Option {
  id?: string;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  subject: string;
  questionText: string;
  explanation?: string | null;
  createdAt: string;
  options: Option[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Constants ─────────────────────────────────────────────────────────
const SUBJECTS = [
  { value: "", label: "All Subjects" },
  { value: "english", label: "English" },
  { value: "mathematics", label: "Mathematics" },
  { value: "commerce", label: "Commerce" },
  { value: "accounting", label: "Accounting" },
  { value: "biology", label: "Biology" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "englishlit", label: "Literature" },
  { value: "government", label: "Government" },
  { value: "crk", label: "CRK" },
  { value: "geography", label: "Geography" },
  { value: "economics", label: "Economics" },
  { value: "history", label: "History" },
  { value: "irk", label: "IRK" },
  { value: "civiledu", label: "Civic Education" },
  { value: "insurance", label: "Insurance" },
  { value: "currentaffairs", label: "Current Affairs" },
];

const SUBJECT_COLORS: Record<string, string> = {
  english: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  mathematics: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  physics: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  chemistry: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  biology: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  economics: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  commerce: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  accounting: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  government: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  geography: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

function subjectLabel(value: string) {
  return SUBJECTS.find((s) => s.value === value)?.label ?? value;
}

function subjectColor(value: string) {
  return SUBJECT_COLORS[value] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}

// ─── Empty option factory ──────────────────────────────────────────────
const emptyOption = (): Option => ({ optionText: "", isCorrect: false });

const defaultForm = () => ({
  subject: "english",
  questionText: "",
  explanation: "",
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
});

// ─── Question Form Modal ───────────────────────────────────────────────
function QuestionFormModal({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Question | null;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (initial) {
      setForm({
        subject: initial.subject,
        questionText: initial.questionText,
        explanation: initial.explanation ?? "",
        options:
          initial.options.length > 0
            ? initial.options.map((o) => ({ id: o.id, optionText: o.optionText, isCorrect: o.isCorrect }))
            : [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
      });
    } else {
      setForm(defaultForm());
    }
  }, [initial, open]);

  const setOption = (i: number, field: keyof Option, value: string | boolean) => {
    setForm((prev) => {
      const options = prev.options.map((o, idx) => {
        if (idx === i) return { ...o, [field]: value };
        // Uncheck other options when this one is marked correct
        if (field === "isCorrect" && value === true) return { ...o, isCorrect: false };
        return o;
      });
      return { ...prev, options };
    });
  };

  const addOption = () => {
    if (form.options.length >= 6) return;
    setForm((prev) => ({ ...prev, options: [...prev.options, emptyOption()] }));
  };

  const removeOption = (i: number) => {
    if (form.options.length <= 2) return;
    setForm((prev) => ({ ...prev, options: prev.options.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async () => {
    if (!form.questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    const hasCorrect = form.options.some((o) => o.isCorrect);
    if (!hasCorrect) {
      toast.error("Mark at least one option as correct");
      return;
    }
    const emptyOpt = form.options.some((o) => !o.optionText.trim());
    if (emptyOpt) {
      toast.error("All option fields must be filled in");
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/cbt/${initial!.id}` : "/api/admin/cbt";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: form.subject,
          questionText: form.questionText.trim(),
          explanation: form.explanation?.trim() || null,
          options: form.options.map((o) => ({
            optionText: o.optionText.trim(),
            isCorrect: o.isCorrect,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to save question");
        return;
      }
      toast.success(isEdit ? "Question updated!" : "Question created!");
      onSaved();
      onClose();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-8 pt-8 pb-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">
                {isEdit ? "Edit" : "New"} Question
              </p>
              <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
                CBT Question Manager
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">
                Subject
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm font-poppins text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 ring-indigo-500/30 transition"
              >
                {SUBJECTS.filter((s) => s.value !== "").map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">
                Question Text
              </label>
              <textarea
                value={form.questionText}
                onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
                rows={4}
                placeholder="Type the question here… HTML is supported (e.g. <em>, <strong>)"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm font-poppins text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 ring-indigo-500/30 transition resize-none"
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">
                Explanation <span className="normal-case tracking-normal font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                value={form.explanation}
                onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
                rows={2}
                placeholder="Why is the correct answer correct?"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm font-poppins text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 ring-indigo-500/30 transition resize-none"
              />
            </div>

            {/* Options */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin">
                  Answer Options
                </label>
                <span className="text-[10px] font-bold text-zinc-400 font-cabin">
                  Click the circle to mark correct
                </span>
              </div>
              <div className="space-y-3">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {/* Correct toggle */}
                    <button
                      type="button"
                      onClick={() => setOption(i, "isCorrect", !opt.isCorrect)}
                      className="shrink-0 transition-transform hover:scale-110"
                      title={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                    >
                      {opt.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </button>

                    {/* Option letter badge */}
                    <span
                      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-cabin ${
                        opt.isCorrect
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>

                    {/* Text input */}
                    <input
                      type="text"
                      value={opt.optionText}
                      onChange={(e) => setOption(i, "optionText", e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-poppins border outline-none focus:ring-2 transition ${
                        opt.isCorrect
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800 ring-emerald-500/20 text-emerald-900 dark:text-emerald-100"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ring-indigo-500/20 text-zinc-800 dark:text-zinc-200"
                      }`}
                    />

                    {/* Remove button */}
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {form.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 flex items-center gap-2 text-[11px] font-black font-cabin uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-8 py-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-sm font-black font-cabin text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-black font-cabin shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create Question"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────
function DeleteDialog({
  question,
  onClose,
  onDeleted,
}: {
  question: Question | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!question) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cbt/${question.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Question deleted");
      onDeleted();
      onClose();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-md text-center"
      >
        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2">
          Delete Question?
        </h3>
        <p className="text-sm text-zinc-500 font-poppins mb-8 leading-relaxed">
          This will permanently remove the question and all its options. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-3 rounded-2xl text-sm font-black font-cabin bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────
export default function CbtQuestionManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(subject && { subject }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/cbt?${params}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
        setPagination(data.pagination);
      }
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [subject, search]);

  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const openCreate = () => {
    setEditingQuestion(null);
    setFormOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">
            CBT Database
          </p>
          <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
            Question Manager
          </h2>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Question
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white dark:bg-zinc-950 rounded-[2rem] p-5 border border-zinc-100 dark:border-zinc-900 shadow-sm flex flex-col sm:flex-row gap-4">
        {/* Subject filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm font-poppins bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-2 rounded-xl outline-none focus:ring-2 ring-indigo-500/20"
          >
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search question text…"
            className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-sm font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 ring-indigo-500/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black font-cabin bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900"
          >
            Search
          </button>
        </form>

        {/* Stats */}
        <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold font-cabin text-zinc-400 uppercase tracking-widest">
          <BookOpen className="w-3.5 h-3.5" />
          {loading ? "…" : pagination.total} Questions
        </div>
      </div>

      {/* ── Question Table ── */}
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden border border-zinc-100 dark:border-zinc-900">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_80px_100px] px-8 py-4 border-b border-zinc-50 dark:border-zinc-900 gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin">Question</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin">Subject</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin text-center">Options</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin text-right">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-50 dark:divide-zinc-900 min-h-[320px]">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px_80px_100px] px-8 py-5 gap-4 animate-pulse">
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                <div className="h-6 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                <div className="h-4 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg mx-auto" />
                <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-xl ml-auto w-20" />
              </div>
            ))
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-8">
              <BookOpen className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
              <p className="font-black font-cabin text-zinc-400 uppercase tracking-wider text-sm">
                No questions found
              </p>
              <p className="text-xs text-zinc-400 font-poppins mt-1">
                {search || subject ? "Try adjusting your filters" : 'Click "Add Question" to get started'}
              </p>
            </div>
          ) : (
            questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1fr_120px_80px_100px] px-8 py-5 gap-4 items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group"
              >
                {/* Question text */}
                <p
                  className="text-sm font-poppins text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: q.questionText.length > 120 ? q.questionText.slice(0, 120) + "…" : q.questionText,
                  }}
                />

                {/* Subject badge */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black font-cabin uppercase tracking-wider ${subjectColor(q.subject)}`}
                >
                  {subjectLabel(q.subject)}
                </span>

                {/* Option count */}
                <span className="text-sm font-black font-cabin text-zinc-500 text-center">
                  {q.options.length}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(q)}
                    className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingQuestion(q)}
                    className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 border-t border-zinc-50 dark:border-zinc-900">
            <button
              onClick={() => fetchQuestions(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-[10px] font-bold font-cabin text-zinc-400 uppercase tracking-widest">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </span>
            <button
              onClick={() => fetchQuestions(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <QuestionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => fetchQuestions(pagination.page)}
        initial={editingQuestion}
      />

      {deletingQuestion && (
        <DeleteDialog
          question={deletingQuestion}
          onClose={() => setDeletingQuestion(null)}
          onDeleted={() => fetchQuestions(pagination.page)}
        />
      )}
    </div>
  );
}
