"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, SlidersHorizontal, Mail, Bot, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { Switch } from "@/components/ui/switch";
import { setUserAiEnabled } from "@/app/(protected)/dashboard/admin/settings/actions";
import { useDepartments } from "@/hooks/useDepartments";
import { useFaculties } from "@/hooks/useFaculties";

const ROLE_STYLES: Record<string, string> = {
  STUDENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "FACULTY REP": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  ASPIRANT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const LEVEL_COLORS: Record<string, string> = {
  "100": "bg-sky-500",
  "200": "bg-violet-500",
  "300": "bg-amber-500",
  "400": "bg-rose-500",
  "500": "bg-emerald-500",
  "600": "bg-indigo-500",
};

function Avatar({ user }: { user: User }) {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black font-cabin text-xs shrink-0 overflow-hidden shadow-sm"
      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
    >
      {user.imageUrl ? (
        <img src={user.imageUrl} alt={user.fullName} className="w-full h-full object-cover" />
      ) : (
        user.fullName?.charAt(0)?.toUpperCase() ?? "?"
      )}
    </div>
  );
}

// ─── Move-to-department modal ──────────────────────────────────────────────────
function MoveDepartmentModal({
  studentName,
  departments,
  facultyNameById,
  currentDepartmentId,
  onClose,
  onConfirm,
  loading,
}: {
  studentName: string;
  departments: { id: string; name?: string; facultyId?: string }[];
  facultyNameById: Map<string, string>;
  currentDepartmentId?: string;
  onClose: () => void;
  onConfirm: (departmentId: string) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState(currentDepartmentId ?? "");

  const grouped = useMemo(() => {
    const byFaculty = new Map<string, { id: string; name?: string }[]>();
    for (const d of departments) {
      const facultyName = (d.facultyId && facultyNameById.get(d.facultyId)) || "Other";
      if (!byFaculty.has(facultyName)) byFaculty.set(facultyName, []);
      byFaculty.get(facultyName)!.push(d);
    }
    return Array.from(byFaculty.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [departments, facultyNameById]);

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
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-500 mb-6 mx-auto">
            <ArrowRightLeft className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 text-center mb-2">
            Move Student
          </h2>
          <p className="text-xs text-zinc-500 font-poppins text-center leading-relaxed mb-6">
            Reassign{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{studentName}</span>{" "}
            to a different department. Their faculty updates to match.
          </p>

          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm font-poppins text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 ring-violet-500/20 mb-8"
          >
            {grouped.map(([facultyName, depts]) => (
              <optgroup key={facultyName} label={facultyName}>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
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
              disabled={loading || !selected || selected === currentDepartmentId}
              className="flex-1 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold font-cabin text-xs uppercase tracking-widest shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Moving…" : "Move"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface Props {
  students: User[] | undefined;
}

const DepartmentStudentsTable: React.FC<Props> = ({ students = [] }) => {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [aiOverrides, setAiOverrides] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<User | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const queryClient = useQueryClient();
  const { data: allDepartments } = useDepartments({ limit: 1000 });
  const { data: allFaculties } = useFaculties(1, 100);
  const facultyNameById = useMemo(
    () => new Map((allFaculties ?? []).map((f) => [f.id, f.name])),
    [allFaculties],
  );

  const handleAiToggle = async (student: User, checked: boolean) => {
    if (!student.id) return;
    const previous = aiOverrides[student.id] ?? student.aiEnabled ?? true;
    setAiOverrides((prev) => ({ ...prev, [student.id!]: checked }));
    setSavingId(student.id);
    try {
      await setUserAiEnabled(student.id, checked);
      toast.success(`AI ${checked ? "enabled" : "disabled"} for ${student.fullName}`);
    } catch (err: any) {
      setAiOverrides((prev) => ({ ...prev, [student.id!]: previous }));
      toast.error(err.message || "Failed to update AI access");
    } finally {
      setSavingId(null);
    }
  };

  const handleMoveDepartment = async (departmentId: string) => {
    if (!moveTarget?.id) return;
    setIsMoving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: moveTarget.id, departmentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to move student");
      }
      toast.success(`${moveTarget.fullName} moved to new department`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setMoveTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to move student");
    } finally {
      setIsMoving(false);
    }
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.matricNo?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q);
      const matchLevel = levelFilter === "ALL" || s.year === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [students, search, levelFilter]);

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden h-fit">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-zinc-50 dark:border-zinc-900">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                Students
              </h3>
              <p className="text-[10px] text-zinc-400 font-poppins">
                {filtered.length} of {students.length} enrolled
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search name, matric, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-2 ring-violet-500/20"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="pl-8 pr-6 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 ring-violet-500/20 appearance-none"
            >
              <option value="ALL">All Levels</option>
              {["100", "200", "300", "400", "500", "600"].map((l) => (
                <option key={l} value={l}>{l}L</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table body */}
      <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold font-cabin text-zinc-500 uppercase tracking-wider">No students found</p>
          </div>
        ) : (
          filtered.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 px-8 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors group"
            >
              {/* Avatar */}
              <Avatar user={student} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins truncate">
                  {student.fullName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                  <p className="text-[10px] text-zinc-400 font-poppins truncate">{student.email}</p>
                </div>
              </div>

              {/* Matric */}
              <div className="hidden sm:block shrink-0">
                <p className="text-[10px] font-bold font-cabin uppercase tracking-wider text-zinc-400">
                  {student.matricNo || "—"}
                </p>
              </div>

              {/* Level pip */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`w-2 h-2 rounded-full ${LEVEL_COLORS[student.year || "100"] ?? "bg-zinc-400"}`} />
                <span className="text-[10px] font-bold font-cabin text-zinc-500">{student.year}L</span>
              </div>

              {/* Role badge */}
              <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black font-cabin uppercase tracking-widest shrink-0 ${ROLE_STYLES[student.role] ?? ROLE_STYLES.STUDENT}`}>
                {student.role === "FACULTY REP" ? "Rep" : student.role}
              </span>

              {/* AI access toggle */}
              <div className="hidden lg:flex items-center gap-1.5 shrink-0" title="AI access">
                <Bot className="w-3.5 h-3.5 text-zinc-400" />
                <Switch
                  size="sm"
                  checked={student.id ? aiOverrides[student.id] ?? student.aiEnabled ?? true : true}
                  disabled={!student.id || savingId === student.id}
                  onCheckedChange={(checked) => handleAiToggle(student, checked)}
                />
              </div>

              {/* Move to department */}
              <button
                onClick={() => setMoveTarget(student)}
                className="shrink-0 w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-violet-600 hover:border-violet-300 dark:hover:border-violet-800 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                title="Move to a different department"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Move department modal */}
      {moveTarget && (
        <MoveDepartmentModal
          studentName={moveTarget.fullName ?? "this student"}
          departments={allDepartments ?? []}
          facultyNameById={facultyNameById}
          currentDepartmentId={moveTarget.departmentId}
          onClose={() => setMoveTarget(null)}
          onConfirm={handleMoveDepartment}
          loading={isMoving}
        />
      )}
    </div>
  );
};

export default DepartmentStudentsTable;
