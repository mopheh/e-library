"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { toast } from "sonner";
import {
  BookMarked,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Tag,
} from "lucide-react";
import { useAdminMaterials } from "@/hooks/useAdminMaterials";
import { SkeletonRow } from "@/components/adminDashboard/SkeletonRow";

function Tile({
  title,
  value,
  icon: Icon,
  loading,
  accent,
  gradient,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
  accent: string;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[2rem] p-7 shadow-sm ${gradient}`}
    >
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1 opacity-60 font-cabin">
        {title}
      </p>
      {loading ? (
        <div className="h-8 w-20 bg-white/20 rounded-xl animate-pulse" />
      ) : (
        <p className="text-3xl font-black font-cabin tracking-tighter">
          <CountUp end={value} duration={1.4} separator="," />
        </p>
      )}
    </motion.div>
  );
}

const MaterialsOverview: React.FC = () => {
  const { data, isLoading, isError, error } = useAdminMaterials();
  const [search, setSearch] = useState("");
  const [onlyZero, setOnlyZero] = useState(false);

  useEffect(() => {
    if (isError) toast.error((error as any)?.message || "Failed to fetch materials overview");
  }, [isError, error]);

  const rows = useMemo(() => {
    const all = data?.byDepartment ?? [];
    const q = search.toLowerCase();
    return all.filter((d) => {
      const matchesSearch =
        !q ||
        d.departmentName.toLowerCase().includes(q) ||
        (d.facultyName ?? "").toLowerCase().includes(q);
      const matchesZero = !onlyZero || d.bookCount === 0;
      return matchesSearch && matchesZero;
    });
  }, [data, search, onlyZero]);

  const zeroDepts = data?.byDepartment.filter((d) => d.bookCount === 0) ?? [];

  return (
    <>
      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Tile
          title="Total Books"
          value={data?.totalBooks ?? 0}
          icon={BookMarked}
          loading={isLoading}
          accent="bg-white/20 text-white"
          gradient="bg-gradient-to-br from-emerald-600 to-teal-600 text-white"
        />
        <Tile
          title="Departments Covered"
          value={data?.departmentsCovered ?? 0}
          icon={CheckCircle2}
          loading={isLoading}
          accent="bg-white/20 text-white"
          gradient="bg-gradient-to-br from-blue-600 to-cyan-600 text-white"
        />
        <Tile
          title="Departments With Nothing"
          value={data?.departmentsWithZero ?? 0}
          icon={AlertTriangle}
          loading={isLoading}
          accent="bg-white/20 text-white"
          gradient="bg-gradient-to-br from-rose-600 to-orange-600 text-white"
        />
        <Tile
          title="Total Departments"
          value={data?.totalDepartments ?? 0}
          icon={Building2}
          loading={isLoading}
          accent="bg-white/20 text-white"
          gradient="bg-gradient-to-br from-slate-700 to-zinc-800 text-white"
        />
      </div>

      {/* Needs-attention callout */}
      {!isLoading && zeroDepts.length > 0 && (
        <div className="mb-8 p-6 rounded-[2rem] bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-black font-cabin uppercase tracking-tight text-rose-900 dark:text-rose-200">
              {zeroDepts.length} department{zeroDepts.length === 1 ? "" : "s"} have zero materials
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {zeroDepts.map((d) => (
              <span
                key={d.departmentId}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 text-[11px] font-semibold text-rose-700 dark:text-rose-300 font-poppins border border-rose-100 dark:border-rose-900/40"
              >
                {d.departmentName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Book type breakdown */}
      {!isLoading && (data?.byType.length ?? 0) > 0 && (
        <div className="mb-8 p-6 rounded-[2rem] bg-white dark:bg-zinc-950 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-black font-cabin uppercase tracking-widest text-zinc-500">
              By Listed Type
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data!.byType.map((t) => (
              <span
                key={t.type}
                className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 font-poppins"
              >
                {t.type} <span className="text-zinc-400">· {t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-department table */}
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="px-8 pt-8 pb-5 border-b border-zinc-50 dark:border-zinc-900">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                  Materials by Department
                </h3>
                <p className="text-[10px] text-zinc-400 font-poppins">
                  {rows.length} of {data?.byDepartment.length ?? 0} departments
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search department or faculty…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-2 ring-emerald-500/20"
              />
            </div>
            <button
              onClick={() => setOnlyZero((v) => !v)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest transition-all ${
                onlyZero
                  ? "bg-rose-600 text-white shadow-md"
                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Zero only
            </button>
          </div>
        </div>

        <div className="divide-y divide-zinc-50 dark:divide-zinc-900 min-h-[200px]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
                <BookMarked className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold font-cabin text-zinc-500 uppercase tracking-wider">No departments match</p>
            </div>
          ) : (
            rows.map((d, i) => (
              <motion.div
                key={d.departmentId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 20) * 0.01 }}
                className="flex items-center gap-4 px-8 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins truncate">
                    {d.departmentName}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-poppins truncate">
                    {d.facultyName ?? "—"}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black font-cabin tabular-nums ${
                    d.bookCount === 0
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  }`}
                >
                  {d.bookCount} book{d.bookCount === 1 ? "" : "s"}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default MaterialsOverview;
