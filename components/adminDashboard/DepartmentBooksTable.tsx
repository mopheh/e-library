"use client";

import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  TriangleAlert,
  X,
  Plus,
  ExternalLink,
  FileText,
  GraduationCap,
  ScrollText,
  BookMarked,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { useCourses } from "@/hooks/useCourses";
import FormModal from "@/components/FormDialogBody";
import { UploadBookForm } from "@/components/adminDashboard/AddBook";
import { Book, Course, Department } from "@/types";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";

const BOOK_TYPES = ["textbook", "past question", "material", "note", "research"] as const;
type BookType = (typeof BOOK_TYPES)[number];

const TYPE_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  textbook: {
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: <BookMarked className="w-3.5 h-3.5" />,
  },
  "past question": {
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
  },
  material: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  note: {
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    icon: <ScrollText className="w-3.5 h-3.5" />,
  },
  research: {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: <GraduationCap className="w-3.5 h-3.5" />,
  },
};

const PAGE_SIZE = 8;

// Book types that support AI question generation
const QUESTION_ELIGIBLE_TYPES = new Set(["past question", "material", "handout"]);

// ── Parse-status badge ─────────────────────────────────────────────────────
const PARSE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType; spin?: boolean }
> = {
  pending:             { label: "Pending",     color: "text-zinc-500  bg-zinc-100  dark:bg-zinc-800",             icon: Clock },
  parsing:             { label: "Parsing…",    color: "text-blue-600  bg-blue-50   dark:bg-blue-900/30",         icon: Loader2, spin: true },
  parsed:              { label: "Parsed",      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",      icon: CheckCircle2 },
  processing:          { label: "Processing…", color: "text-amber-600  bg-amber-50  dark:bg-amber-900/30",      icon: Loader2, spin: true },
  generating_questions:{ label: "Generating…", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",     icon: Loader2, spin: true },
  completed:           { label: "AI Ready",    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",  icon: CheckCircle2 },
  failed:              { label: "Failed",      color: "text-red-600    bg-red-50    dark:bg-red-900/30",        icon: AlertCircle },
};

function ParseStatusBadge({ status }: { status?: Book["parseStatus"] | null }) {
  if (!status) return null;
  const cfg = PARSE_STATUS_CONFIG[status] ?? PARSE_STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full font-cabin ${cfg.color}`}>
      <Icon className={`w-2.5 h-2.5 ${cfg.spin ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

// ── Generate Questions hook ────────────────────────────────────────────────
function useGenerateQuestions() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState<Set<string>>(new Set());

  const generate = useCallback(async (book: Book) => {
    if (generating.has(book.id)) return;
    setGenerating((prev) => new Set(prev).add(book.id));
    const toastId = toast.loading(`Generating questions for "${book.title}"…`, {
      description: "This may take up to a minute. You can keep working.",
    });
    try {
      const res = await fetch(`/api/books/${book.id}/question`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      toast.success("Questions generated!", {
        id: toastId,
        description: `MCQs are now live for "${book.title}".`,
      });
      await queryClient.invalidateQueries({ queryKey: ["books"] });
    } catch (err: any) {
      toast.error("Generation failed", { id: toastId, description: err.message });
    } finally {
      setGenerating((prev) => { const s = new Set(prev); s.delete(book.id); return s; });
    }
  }, [generating, queryClient]);

  return { generate, generating };
}

// ──────────────────────────────────────────────────
// Delete Confirmation
// ──────────────────────────────────────────────────
function DeleteBookModal({
  book,
  onClose,
  onConfirm,
  loading,
}: {
  book: Book;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl p-8 w-full max-w-sm"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 mb-5 mx-auto">
            <TriangleAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 text-center mb-1">
            Delete Book?
          </h2>
          <p className="text-xs text-zinc-500 font-poppins text-center leading-relaxed mb-2">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">"{book.title}"</span> and all its
            annotations, reading sessions and page data will be permanently removed.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 text-center mb-7">
            This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold font-cabin text-[10px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold font-cabin text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────────
// Edit Book Form
// ──────────────────────────────────────────────────
function EditBookModal({
  book,
  departmentId,
  onClose,
}: {
  book: Book;
  departmentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: courses = [] } = useCourses({ departmentId, limit: 1000, includeBorrowed: true });

  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      title: book.title,
      description: book.description,
      type: book.type,
      courseIds: [] as string[],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update");
      toast.success("Book updated", { description: "Changes saved successfully." });
      await queryClient.invalidateQueries({ queryKey: ["books"] });
      onClose();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-zinc-50 dark:border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-cabin">Edit Book</p>
                <p className="text-xs text-zinc-500 font-poppins truncate max-w-[240px]">{book.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-cabin">Title</label>
              <input
                {...register("title", { required: true })}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl text-sm font-poppins focus:outline-none focus:ring-2 ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-cabin">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl text-sm font-poppins focus:outline-none focus:ring-2 ring-blue-500/20 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-cabin">Type</label>
              <select
                {...register("type", { required: true })}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl text-sm font-poppins focus:outline-none focus:ring-2 ring-blue-500/20"
              >
                {BOOK_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-cabin">
                Courses <span className="normal-case tracking-normal font-normal text-zinc-400">(Ctrl/Cmd+click to multi-select)</span>
              </label>
              <Controller
                control={control}
                name="courseIds"
                render={({ field }) => (
                  <select
                    multiple
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(Array.from(e.target.selectedOptions, (o) => o.value))
                    }
                    className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl text-sm font-poppins focus:outline-none focus:ring-2 ring-blue-500/20 min-h-[100px]"
                  >
                    {(courses as Course[]).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} — {c.title}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black font-cabin text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────────
// Main Books Table
// ──────────────────────────────────────────────────
interface Props {
  departmentId: string;
  department: Department | null;
}

const DepartmentBooksTable: React.FC<Props> = ({ departmentId, department }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { generate, generating } = useGenerateQuestions();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data = { books: [], totalPages: 1 }, isLoading } = useBooks({
    departmentId,
    page,
    pageSize: PAGE_SIZE,
    type: typeFilter === "ALL" ? undefined : typeFilter,
    search: search.trim().length >= 2 ? search.trim() : undefined,
  });

  const { books: bookList = [], totalPages = 1 } = data;

  const deptForForm: Department[] = department ? [department] : [];

  const handleDelete = async () => {
    if (!deleteBook) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/books/${deleteBook.id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete");
      toast.success(`"${deleteBook.title}" deleted`);
      await queryClient.invalidateQueries({ queryKey: ["books"] });
      setDeleteBook(null);
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Modals */}
      {editBook && (
        <EditBookModal
          book={editBook}
          departmentId={departmentId}
          onClose={() => setEditBook(null)}
        />
      )}
      {deleteBook && (
        <DeleteBookModal
          book={deleteBook}
          onClose={() => setDeleteBook(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
      <FormModal open={addOpen} setOpen={setAddOpen}>
        <UploadBookForm department={deptForForm} setOpen={setAddOpen} departmentId={departmentId} />
      </FormModal>

      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-zinc-50 dark:border-zinc-900">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                  Library
                </h3>
                <p className="text-[10px] text-zinc-400 font-poppins">
                  {bookList.length} book{bookList.length !== 1 ? "s" : ""} shown
                </p>
              </div>
            </div>

            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search books…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-2 ring-blue-500/20"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="pl-8 pr-6 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 ring-blue-500/20 appearance-none"
              >
                <option value="ALL">All Types</option>
                {BOOK_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Book rows */}
        <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-8 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-3/4" />
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/2" />
                </div>
              </div>
            ))
          ) : bookList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold font-cabin text-zinc-500 uppercase tracking-wider">No books found</p>
            </div>
          ) : (
            bookList.map((book: Book, i: number) => {
              const typeKey = book.type?.toLowerCase() as BookType;
              const typeStyle = TYPE_STYLES[typeKey] ?? {
                color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                icon: <FileText className="w-3.5 h-3.5" />,
              };

              return (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 px-8 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors group"
                >
                  {/* Type icon bubble */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeStyle.color}`}>
                    {typeStyle.icon}
                  </div>

                  {/* Title + course */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/book/${book.id}`)}
                  >
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {book.title}
                    </p>
                    {book.course && (
                      <p className="text-[10px] text-zinc-400 font-poppins truncate mt-0.5">
                        {book.course}
                      </p>
                    )}
                  </div>

                  {/* Type badge */}
                  <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black font-cabin uppercase tracking-widest shrink-0 ${typeStyle.color}`}>
                    {typeStyle.icon}
                    {book.type}
                  </span>

                  {/* Parse status badge */}
                  <span className="hidden md:block shrink-0">
                    <ParseStatusBadge status={book.parseStatus} />
                  </span>

                  {/* Date */}
                  <span className="hidden lg:block text-[10px] text-zinc-400 font-poppins shrink-0">
                    {new Date(book.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </span>

                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {/* Generate Questions button — only for eligible book types */}
                    {QUESTION_ELIGIBLE_TYPES.has(book.type?.toLowerCase()) && (
                      <button
                        onClick={() => generate(book)}
                        disabled={generating.has(book.id) || book.parseStatus === "parsing" || book.parseStatus === "generating_questions" || book.parseStatus === "processing"}
                        title={book.parseStatus === "completed" ? "Re-generate questions" : "Generate AI questions"}
                        className="h-8 px-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/40 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {generating.has(book.id) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[9px] font-black font-cabin uppercase tracking-widest hidden xl:block">
                          {generating.has(book.id) ? "Generating…" : "Gen. Questions"}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/book/${book.id}`)}
                      title="Open book"
                      className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditBook(book)}
                      title="Edit book"
                      className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteBook(book)}
                      title="Delete book"
                      className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-5 border-t border-zinc-50 dark:border-zinc-900 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors font-cabin"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-[10px] font-bold font-cabin text-zinc-400 uppercase tracking-widest">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors font-cabin"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DepartmentBooksTable;
