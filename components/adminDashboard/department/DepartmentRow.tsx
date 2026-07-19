"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDepartmentUsers } from "@/hooks/useUsers";
import { useFaculties } from "@/hooks/useFaculties";
import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  Users,
  Edit2,
  Trash2,
  Check,
  X,
  TriangleAlert,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DEPT_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-yellow-600",
  "from-cyan-500 to-sky-600",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return DEPT_COLORS[Math.abs(hash) % DEPT_COLORS.length];
}

// ─── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  deptName,
  onClose,
  onConfirm,
  loading,
}: {
  deptName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl p-8 w-full max-w-md"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 mb-6 mx-auto">
            <TriangleAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 text-center mb-2">
            Delete Department?
          </h2>
          <p className="text-xs text-zinc-500 font-poppins text-center leading-relaxed mb-2">
            This will permanently remove{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {deptName}
            </span>{" "}
            and all its associated courses, books, and student records.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 text-center mb-8">
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold font-cabin text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold font-cabin text-xs uppercase tracking-widest shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Move-to-faculty modal ──────────────────────────────────────────────────────
function MoveFacultyModal({
  deptName,
  faculties,
  currentFacultyId,
  onClose,
  onConfirm,
  loading,
}: {
  deptName: string;
  faculties: { id: string; name: string }[];
  currentFacultyId?: string;
  onClose: () => void;
  onConfirm: (facultyId: string) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState(currentFacultyId ?? "");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl p-8 w-full max-w-md"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 mb-6 mx-auto">
            <ArrowRightLeft className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 text-center mb-2">
            Move Department
          </h2>
          <p className="text-xs text-zinc-500 font-poppins text-center leading-relaxed mb-6">
            Reassign{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{deptName}</span>{" "}
            to a different faculty. Courses, books, and students stay attached to the department.
          </p>

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-poppins text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 ring-blue-500/20 mb-8"
          >
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold font-cabin text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selected)}
              disabled={loading || !selected || selected === currentFacultyId}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold font-cabin text-xs uppercase tracking-widest shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Moving…" : "Move"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
const DepartmentRow = ({
  departmentId,
  name,
  facultyId,
}: {
  departmentId: string;
  name: string;
  facultyId?: string;
}) => {
  const { data: users, isLoading, isError } = useDepartmentUsers(departmentId);
  const { data: faculties } = useFaculties(1, 100);
  const queryClient = useQueryClient();
  const gradient = getGradient(name);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const studentCount = isLoading ? null : isError ? null : (users?.length ?? 0);
  const fillPct = studentCount === null ? 0 : Math.min(100, (studentCount / 200) * 100);
  const currentFacultyName = faculties?.find((f) => f.id === facultyId)?.name;

  // ── Handlers ──────────────────────────────────────────────
  const handleUpdate = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === name) {
      setIsEditing(false);
      setEditName(name);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: departmentId, name: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      toast.success("Department renamed successfully");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/departments?id=${departmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Department deleted");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setShowDeleteModal(false);
    } catch (e: any) {
      toast.error(e.message);
      setIsDeleting(false);
    }
  };

  const handleMove = async (newFacultyId: string) => {
    setIsMoving(true);
    try {
      const res = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: departmentId, facultyId: newFacultyId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to move department");
      }
      toast.success("Department moved to new faculty");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setShowMoveModal(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <>
      {/* Delete confirm modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          deptName={name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          loading={isDeleting}
        />
      )}

      {/* Move faculty modal */}
      {showMoveModal && (
        <MoveFacultyModal
          deptName={name}
          faculties={faculties ?? []}
          currentFacultyId={facultyId}
          onClose={() => setShowMoveModal(false)}
          onConfirm={handleMove}
          loading={isMoving}
        />
      )}

      <motion.div
        layout
        className="group relative flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 pl-5 pr-4 sm:pr-5 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/60 transition-all duration-200 overflow-hidden"
      >
        {/* Animated left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${gradient}`}
            initial={{ height: 0 }}
            animate={{ height: `${fillPct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          />
        </div>

        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black font-cabin text-sm shrink-0 shadow-md`}
        >
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Name & stats */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate();
                  if (e.key === "Escape") { setIsEditing(false); setEditName(name); }
                }}
                className="w-full px-2 py-1 text-sm font-bold text-zinc-900 dark:text-zinc-50 font-cabin bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded outline-none focus:border-amber-500"
                autoFocus
                disabled={isSaving}
              />
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditName(name); }}
                disabled={isSaving}
                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 font-cabin truncate">
              {name}
            </p>
          )}

          <div className="flex items-center gap-3 mt-0.5">
            {isLoading ? (
              <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins">
                <Users className="w-3 h-3" />
                {studentCount ?? "—"} students
              </span>
            )}
            {currentFacultyName && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins truncate">
                <Building2 className="w-3 h-3 shrink-0" />
                {currentFacultyName}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons — always reachable on touch; hover-reveal only from sm: up */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
            {/* Manage link */}
            <Link
              href={`/data/departments/${departmentId}`}
              className="flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest font-cabin text-zinc-600 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
            >
              Manage
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Edit */}
            <button
              onClick={() => setIsEditing(true)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-sm"
              title="Rename department"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Move to faculty */}
            <button
              onClick={() => setShowMoveModal(true)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-amber-600 hover:border-amber-300 dark:hover:border-amber-800 transition-all shadow-sm"
              title="Move to a different faculty"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-all shadow-sm disabled:opacity-50"
              title="Delete department"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Static icon fallback — desktop only; mobile always shows real actions instead */}
        {!isEditing && (
          <div className="hidden sm:block shrink-0 opacity-100 group-hover:opacity-0 transition-all pointer-events-none absolute right-5">
            <Building2 className="w-4 h-4 text-zinc-200 dark:text-zinc-700" />
          </div>
        )}
      </motion.div>
    </>
  );
};

export default DepartmentRow;
