"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, SlidersHorizontal, Mail } from "lucide-react";
import { User } from "@/types";

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

interface Props {
  students: User[] | undefined;
}

const DepartmentStudentsTable: React.FC<Props> = ({ students = [] }) => {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

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
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default DepartmentStudentsTable;
