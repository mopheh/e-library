"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUsers } from "@/hooks/useUsers";
import { 
  UserPlus, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  ShieldCheck, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  TriangleAlert, 
  Plus, 
  Building2, 
  ArrowRight,
  BookOpen 
} from "lucide-react";
import AddRepModal from "./AddRepModal";
import { Faculty, User } from "@/types";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDepartmentsOfFaculty } from "@/actions/preview";
import { createDepartment } from "@/actions/department";
import Link from "next/link";

const FACULTY_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-fuchsia-600",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FACULTY_COLORS[Math.abs(hash) % FACULTY_COLORS.length];
}

function DeleteConfirmModal({
  faculty,
  onClose,
  onConfirm,
  loading,
}: {
  faculty: String;
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
            Delete Faculty?
          </h2>
          <p className="text-xs text-zinc-500 font-poppins text-center leading-relaxed mb-2">
            This will permanently remove{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {faculty}
            </span>{" "}
            and all associated data including faculty reps, study rooms, and resource requests.
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

function DeleteDeptConfirmModal({
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

const FacultyRow = ({
  facultyId,
  name,
}: {
  facultyId: string;
  name: string;
}) => {
  const { data: users, isLoading } = useUsers(facultyId);
  const [openRepModal, setOpenRepModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleteFaculty, setDeleteFaculty] = useState<String | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Departments management inside expanded area
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [addingDept, setAddingDept] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [updatingDeptId, setUpdatingDeptId] = useState<string | null>(null);
  const [deletingDept, setDeletingDept] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingDept, setIsDeletingDept] = useState(false);

  const reps = (users ?? []).filter((u: User) => u.role === "FACULTY REP");
  const students = (users ?? []).filter((u: User) => u.role === "STUDENT");
  const maxRepsReached = reps.length >= 2;
  const gradient = getGradient(name);

  const fetchDepts = async () => {
    setLoadingDepts(true);
    try {
      const res = await getDepartmentsOfFaculty(facultyId);
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoadingDepts(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      fetchDepts();
    }
  }, [expanded, facultyId]);

  const handleUpdate = async () => {
    if (!editName.trim() || editName === name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: facultyId, name: editName }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Updated successfully");
      setIsEditing(false);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFaculty) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/faculty?id=${facultyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deleted successfully");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message);
      setIsDeleting(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newDeptName.trim();
    if (!name) return;
    setAddingDept(true);
    try {
      await createDepartment({ name, faculty: facultyId });
      toast.success("Department added successfully");
      setNewDeptName("");
      fetchDepts();
    } catch (err: any) {
      toast.error(err.message || "Failed to add department");
    } finally {
      setAddingDept(false);
    }
  };

  const handleUpdateDept = async (id: string) => {
    const trimmed = editDeptName.trim();
    if (!trimmed) return;
    setUpdatingDeptId(id);
    try {
      const res = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Department renamed successfully");
      setEditingDeptId(null);
      fetchDepts();
    } catch (err: any) {
      toast.error(err.message || "Failed to update department");
    } finally {
      setUpdatingDeptId(null);
    }
  };

  const handleDeleteDept = async () => {
    if (!deletingDept) return;
    setIsDeletingDept(true);
    try {
      const res = await fetch(`/api/departments?id=${deletingDept.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Department deleted successfully");
      setDeletingDept(null);
      fetchDepts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete department");
    } finally {
      setIsDeletingDept(false);
    }
  };

  return (
    <>
      {deleteFaculty && (
        <DeleteConfirmModal
          faculty={deleteFaculty}
          onClose={() => setDeleteFaculty(null)}
          onConfirm={handleDelete}
          loading={isDeleting}
        />
      )}
      {deletingDept && (
        <DeleteDeptConfirmModal
          deptName={deletingDept.name}
          onClose={() => setDeletingDept(null)}
          onConfirm={handleDeleteDept}
          loading={isDeletingDept}
        />
      )}
      <motion.div
        layout
        className="group rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/60 transition-all duration-200 overflow-hidden"
      >
        {/* Main row */}
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black font-cabin text-sm shrink-0 shadow-md`}
          >
            {name.charAt(0).toUpperCase()}
          </div>

          {/* Name & meta */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 text-sm font-bold text-zinc-900 dark:text-zinc-50 font-cabin bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded outline-none focus:border-indigo-500"
                  autoFocus
                />
                <button onClick={handleUpdate} disabled={isSaving} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setIsEditing(false); setEditName(name); }} disabled={isSaving} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded">
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
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
              ) : (
                <>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins">
                    <Users className="w-3 h-3" />
                    {students.length} students
                  </span>
                  {reps.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-poppins">
                      <ShieldCheck className="w-3 h-3" />
                      {reps.length} rep{reps.length > 1 ? "s" : ""}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Rep avatars */}
          {reps.length > 0 && (
            <TooltipProvider>
              <div className="hidden sm:flex -space-x-2 shrink-0">
                {reps.map((rep: User, idx: number) => (
                  <Tooltip key={rep.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-8 h-8 rounded-xl border-2 border-white dark:border-zinc-950 overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black font-cabin text-[10px] shadow-sm hover:scale-110 transition-transform cursor-default"
                        style={{ zIndex: reps.length - idx }}
                      >
                        {rep.imageUrl ? (
                          <img src={rep.imageUrl} alt={rep.fullName} className="w-full h-full object-cover" />
                        ) : (
                          rep.fullName?.charAt(0).toUpperCase()
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-zinc-800">
                      <p className="text-xs font-bold text-white font-poppins">{rep.fullName}</p>
                      <p className="text-[10px] text-zinc-400 font-poppins">{rep.email}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!maxRepsReached && (
              <button
                onClick={() => setOpenRepModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest font-cabin text-zinc-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Assign Rep</span>
              </button>
            )}

            {!isEditing && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-sm"
                  title="Edit Faculty"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteFaculty(name)}
                  disabled={isDeleting}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-all shadow-sm"
                  title="Delete Faculty"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded rep & department details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
                
                {/* 1. Representatives Section */}
                {reps.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2.5">
                      Faculty Representatives
                    </p>
                    <div className="space-y-2">
                      {reps.map((rep: User) => (
                        <div
                          key={rep.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100/60 dark:border-amber-900/30"
                        >
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black font-cabin text-xs shrink-0">
                            {rep.imageUrl ? (
                              <img src={rep.imageUrl} alt={rep.fullName} className="w-full h-full object-cover" />
                            ) : (
                              rep.fullName?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-cabin truncate">
                              {rep.fullName}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-poppins truncate">{rep.email}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black font-cabin uppercase tracking-widest shrink-0">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Rep
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Departments Section — Revamped */}
                <div className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 font-cabin">
                          Departments
                        </p>
                        <p className="text-[9px] text-zinc-400 font-poppins">
                          {departments.length} registered
                        </p>
                      </div>
                    </div>
                    {departments.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black font-cabin uppercase tracking-widest">
                        <BookOpen className="w-2.5 h-2.5" />
                        {departments.reduce((s: number, d: any) => s + (d.stats?.booksCount ?? 0), 0)} texts
                      </span>
                    )}
                  </div>

                  {/* Department Cards */}
                  {loadingDepts ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                      ))}
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <Building2 className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 font-cabin uppercase tracking-wider">No Departments Yet</p>
                      <p className="text-[10px] text-zinc-400 font-poppins mt-0.5">Add the first department below</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {departments.map((dept: any, idx: number) => {
                        const isEditingDept = editingDeptId === dept.id;
                        const deptColors = [
                          "from-indigo-500 to-violet-500",
                          "from-blue-500 to-cyan-500",
                          "from-emerald-500 to-teal-500",
                          "from-rose-500 to-pink-500",
                          "from-amber-500 to-orange-500",
                        ];
                        const color = deptColors[idx % deptColors.length];
                        return (
                          <motion.div
                            key={dept.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ delay: idx * 0.04 }}
                            className="group/dept relative flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all"
                          >
                            {/* Color dot */}
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black font-cabin text-[10px] shrink-0 shadow-sm`}>
                              {dept.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {isEditingDept ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editDeptName}
                                    onChange={(e) => setEditDeptName(e.target.value)}
                                    className="flex-1 px-2 py-1 text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-indigo-300 dark:border-indigo-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                                    autoFocus
                                    disabled={updatingDeptId === dept.id}
                                  />
                                  <button
                                    onClick={() => handleUpdateDept(dept.id)}
                                    disabled={updatingDeptId === dept.id}
                                    className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingDeptId(null)}
                                    disabled={updatingDeptId === dept.id}
                                    className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-cabin truncate leading-tight">
                                    {dept.name}
                                  </p>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-poppins">
                                      <Users className="w-2.5 h-2.5" />
                                      {dept.stats?.studentsCount ?? 0} students
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] text-zinc-400 font-poppins">
                                      <BookOpen className="w-2.5 h-2.5" />
                                      {dept.stats?.booksCount ?? 0} texts
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Hover Actions */}
                            {!isEditingDept && (
                              <div className="flex items-center gap-1.5 opacity-0 group-hover/dept:opacity-100 transition-all duration-200 shrink-0">
                                <Link
                                  href={`/data/departments/${dept.id}`}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest font-cabin text-white transition-all shadow-sm shadow-indigo-500/20"
                                >
                                  Manage <ArrowRight className="w-2.5 h-2.5" />
                                </Link>
                                <button
                                  onClick={() => { setEditingDeptId(dept.id); setEditDeptName(dept.name); }}
                                  className="w-7 h-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                  title="Rename"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setDeletingDept({ id: dept.id, name: dept.name })}
                                  className="w-7 h-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Department Form */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">
                      Add Department
                    </p>
                    <form onSubmit={handleAddDept} className="flex gap-2">
                      <div className="flex-1 relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Department name…"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="w-full pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                          disabled={addingDept}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={addingDept || !newDeptName.trim()}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest font-cabin flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"
                      >
                        {addingDept ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        Add
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default FacultyRow;
