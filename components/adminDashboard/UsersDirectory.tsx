"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  SlidersHorizontal,
  Mail,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useUsersDirectory } from "@/hooks/useUsers";
import { useFaculties } from "@/hooks/useFaculties";
import { SkeletonRow } from "@/components/adminDashboard/SkeletonRow";

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

function Avatar({ fullName, imageUrl }: { fullName?: string; imageUrl?: string | null }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black font-cabin text-xs shrink-0 overflow-hidden shadow-sm"
      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={fullName ?? ""} className="w-full h-full object-cover" />
      ) : (
        fullName?.charAt(0)?.toUpperCase() ?? "?"
      )}
    </div>
  );
}

function formatJoinDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const ROLE_OPTIONS = ["ALL", "STUDENT", "ADMIN", "FACULTY REP", "ASPIRANT"] as const;

const UsersDirectory: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [facultyFilter, setFacultyFilter] = useState<string>("ALL");
  const limit = 20;

  const { data: faculties } = useFaculties(1, 100);

  const { data, isLoading, isFetching, isError, error } = useUsersDirectory({
    page,
    limit,
    search: search || undefined,
    role: roleFilter === "ALL" ? undefined : roleFilter,
    facultyId: facultyFilter === "ALL" ? undefined : facultyFilter,
  });

  useEffect(() => {
    if (isError) toast.error((error as any)?.message || "Failed to fetch users");
  }, [isError, error]);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, facultyFilter]);

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-zinc-50 dark:border-zinc-900">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                Platform Users
              </h3>
              <p className="text-[10px] text-zinc-400 font-poppins">
                {pagination ? `${pagination.total.toLocaleString()} total across every faculty` : "Every account on the platform"}
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-8 pr-6 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 ring-violet-500/20 appearance-none"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r === "ALL" ? "All Roles" : r === "FACULTY REP" ? "Faculty Rep" : r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="pl-3 pr-6 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 ring-violet-500/20 appearance-none max-w-[160px]"
            >
              <option value="ALL">All Faculties</option>
              {(faculties ?? []).map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table body */}
      <div className="divide-y divide-zinc-50 dark:divide-zinc-900 min-h-[200px]">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold font-cabin text-zinc-500 uppercase tracking-wider">No users found</p>
          </div>
        ) : (
          users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.015 }}
              className="flex items-center gap-4 px-8 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors"
            >
              <Avatar fullName={user.fullName} imageUrl={user.imageUrl} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins truncate">
                  {user.fullName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                  <p className="text-[10px] text-zinc-400 font-poppins truncate">{user.email}</p>
                </div>
              </div>

              {/* Matric */}
              <div className="hidden md:block shrink-0 w-24">
                <p className="text-[10px] font-bold font-cabin uppercase tracking-wider text-zinc-400 truncate">
                  {user.matricNo || "—"}
                </p>
              </div>

              {/* Faculty / Department */}
              <div className="hidden lg:block shrink-0 w-40">
                <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 font-poppins truncate">
                  {user.department?.name || "—"}
                </p>
                <p className="text-[9px] text-zinc-400 font-poppins truncate">
                  {user.faculty?.name || ""}
                </p>
              </div>

              {/* Level pip (students only) */}
              {user.year ? (
                <div className="hidden sm:flex items-center gap-1.5 shrink-0 w-10">
                  <span className={`w-2 h-2 rounded-full ${LEVEL_COLORS[user.year] ?? "bg-zinc-400"}`} />
                  <span className="text-[10px] font-bold font-cabin text-zinc-500">{user.year}L</span>
                </div>
              ) : (
                <div className="hidden sm:block w-10 shrink-0" />
              )}

              {/* Role badge */}
              <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black font-cabin uppercase tracking-widest shrink-0 ${ROLE_STYLES[user.role] ?? ROLE_STYLES.STUDENT}`}>
                {user.role === "FACULTY REP" ? "Rep" : user.role}
              </span>

              {/* AI access indicator (read-only here — toggle lives in the per-department view) */}
              <div className="hidden lg:flex items-center gap-1.5 shrink-0 w-8" title={user.aiEnabled === false ? "AI access disabled" : "AI access enabled"}>
                <Bot className={`w-3.5 h-3.5 ${user.aiEnabled === false ? "text-zinc-300 dark:text-zinc-700" : "text-emerald-500"}`} />
              </div>

              {/* Joined */}
              <div className="hidden xl:block shrink-0 w-24 text-right">
                <p className="text-[10px] text-zinc-400 font-poppins">{formatJoinDate(user.createdAt)}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-5 border-t border-zinc-50 dark:border-zinc-900">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || isFetching}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-[10px] font-bold font-cabin text-zinc-400 uppercase tracking-widest">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
            disabled={page >= pagination.totalPages || isFetching}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors font-cabin"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersDirectory;
