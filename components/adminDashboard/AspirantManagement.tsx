"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  BarChart3,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { approveVerification, rejectVerification, getSignedProofUrl } from "@/actions/admin";

type VerifStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

interface Aspirant {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  jambScore: number | null;
  jambNo: string | null;
  level: string | null;
  admissionYear: string | null;
  subjectCombinations: string[] | null;
  verificationStatus: VerifStatus;
  verificationId: string | null;
  deptName: string | null;
  facultyName: string | null;
  cbtAttempts: number;
  verificationCreatedAt: string | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  noRequest: number;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  NO_REQUEST: {
    label: "No Request",
    icon: HelpCircle,
    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
};

function StatusBadge({ status }: { status: VerifStatus }) {
  const key = status ?? "NO_REQUEST";
  const cfg = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black font-cabin uppercase tracking-widest ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function AspirantDetailModal({
  aspirant,
  onClose,
  onRefresh,
}: {
  aspirant: Aspirant;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [viewingDoc, setViewingDoc] = useState(false);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);

  const handleViewDoc = async () => {
    if (!aspirant.verificationId) return;
    setViewingDoc(true);
    try {
      // Fetch the proof URL from the verification request
      const res = await fetch(`/api/admin/aspirants/${aspirant.id}/proof`);
      if (!res.ok) throw new Error("Could not get proof URL");
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to open document");
    } finally {
      setViewingDoc(false);
    }
  };

  const handleApprove = async () => {
    if (!aspirant.verificationId) return;
    setActionLoading("approve");
    const res = await approveVerification(aspirant.verificationId);
    if (res.success) {
      toast.success(`${aspirant.fullName} approved as student`);
      onRefresh();
      onClose();
    } else {
      toast.error(res.error || "Failed to approve");
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!aspirant.verificationId) return;
    setActionLoading("reject");
    const res = await rejectVerification(aspirant.verificationId);
    if (res.success) {
      toast.success(`Verification rejected for ${aspirant.fullName}`);
      onRefresh();
      onClose();
    } else {
      toast.error(res.error || "Failed to reject");
    }
    setActionLoading(null);
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
          className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-zinc-50 dark:border-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black font-cabin text-xl shadow-lg shadow-indigo-500/25">
                  {aspirant.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black font-cabin text-zinc-900 dark:text-zinc-50">
                    {aspirant.fullName}
                  </h3>
                  <p className="text-xs text-zinc-400 font-poppins">{aspirant.email}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={aspirant.verificationStatus} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-8 py-6 space-y-5">
            {/* Profile grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "JAMB No.", value: aspirant.jambNo ?? "—" },
                { label: "JAMB Score", value: aspirant.jambScore?.toString() ?? "—" },
                { label: "Entry Level", value: aspirant.level ? `${aspirant.level}L` : "—" },
                { label: "Admission Year", value: aspirant.admissionYear ?? "—" },
                { label: "Dept. Applied", value: aspirant.deptName ?? "—" },
                { label: "Faculty", value: aspirant.facultyName ?? "—" },
                { label: "CBT Attempts", value: aspirant.cbtAttempts?.toString() ?? "0" },
                {
                  label: "Registered",
                  value: aspirant.createdAt
                    ? new Date(aspirant.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })
                    : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins truncate">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Subjects */}
            {aspirant.subjectCombinations && aspirant.subjectCombinations.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">
                  Subject Combinations
                </p>
                <div className="flex flex-wrap gap-2">
                  {aspirant.subjectCombinations.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold font-cabin uppercase tracking-wider"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {aspirant.verificationStatus === "PENDING" && aspirant.verificationId && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleViewDoc}
                  disabled={viewingDoc}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold font-cabin text-[10px] uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  {viewingDoc ? "Opening…" : "View Proof Document"}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleReject}
                    disabled={!!actionLoading}
                    className="py-3.5 rounded-2xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold font-cabin text-[10px] uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50"
                  >
                    {actionLoading === "reject" ? "Rejecting…" : "✕ Reject"}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={!!actionLoading}
                    className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-cabin text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    {actionLoading === "approve" ? "Approving…" : "✓ Approve"}
                  </button>
                </div>
              </div>
            )}

            {aspirant.verificationStatus !== "PENDING" && (
              <div className={`px-5 py-4 rounded-2xl text-xs font-poppins text-center ${
                aspirant.verificationStatus === "APPROVED"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : aspirant.verificationStatus === "REJECTED"
                  ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
              }`}>
                {aspirant.verificationStatus === "APPROVED"
                  ? "✓ This aspirant has been approved and upgraded to a student account."
                  : aspirant.verificationStatus === "REJECTED"
                  ? "✕ This verification request was rejected."
                  : "No verification request submitted yet."}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────
const AspirantManagement: React.FC = () => {
  const [aspirants, setAspirants] = useState<Aspirant[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, noRequest: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAspirant, setSelectedAspirant] = useState<Aspirant | null>(null);

  const fetchAspirants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        status: statusFilter,
        ...(search.trim().length >= 2 ? { search: search.trim() } : {}),
      });
      const res = await fetch(`/api/admin/aspirants?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAspirants(data.aspirants);
      setStats(data.stats);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load aspirants");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchAspirants, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchAspirants]);

  const STAT_CARDS = [
    { label: "Total Aspirants", value: stats.total, icon: Users, color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30" },
  ];

  const STATUS_FILTERS = [
    { id: "ALL", label: "All" },
    { id: "PENDING", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
    { id: "NO_REQUEST", label: "No Request" },
  ];

  return (
    <>
      {selectedAspirant && (
        <AspirantDetailModal
          aspirant={selectedAspirant}
          onClose={() => setSelectedAspirant(null)}
          onRefresh={fetchAspirants}
        />
      )}

      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-zinc-950 rounded-[2rem] px-6 py-6 shadow-sm flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black font-cabin text-zinc-900 dark:text-zinc-50">{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-cabin">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table panel */}
        <div className="bg-white dark:bg-zinc-950 rounded-[3rem] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-10 pt-10 pb-6 border-b border-zinc-50 dark:border-zinc-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                  Aspirants
                </h2>
                <p className="text-xs text-zinc-500 font-poppins mt-0.5">
                  Pre-admission candidates — review, approve, or reject verifications
                </p>
              </div>
              <button
                onClick={fetchAspirants}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-black font-cabin text-[10px] uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-poppins text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-2 ring-indigo-500/20"
                />
              </div>

              {/* Status filter pills */}
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setStatusFilter(f.id); setPage(1); }}
                    className={`px-4 py-2.5 rounded-xl font-black font-cabin text-[10px] uppercase tracking-widest transition-all ${
                      statusFilter === f.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    {f.label}
                    {f.id === "PENDING" && stats.pending > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black">
                        {stats.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-5 px-10 py-4 animate-pulse">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/3" />
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/4" />
                  </div>
                  <div className="w-20 h-6 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
                </div>
              ))
            ) : aspirants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold font-cabin text-zinc-500 uppercase tracking-wider">No aspirants found</p>
                <p className="text-xs text-zinc-400 mt-1 font-poppins">Try adjusting your filters</p>
              </div>
            ) : (
              aspirants.map((aspirant, i) => (
                <motion.button
                  key={aspirant.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedAspirant(aspirant)}
                  className="w-full flex items-center gap-5 px-10 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors group text-left"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black font-cabin text-sm shrink-0 shadow-md shadow-indigo-500/20">
                    {aspirant.fullName?.charAt(0)?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins truncate">
                      {aspirant.fullName}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-poppins truncate">{aspirant.email}</p>
                  </div>

                  {/* Dept */}
                  <div className="hidden md:block min-w-0 max-w-[160px]">
                    <p className="text-[10px] text-zinc-500 font-poppins truncate">
                      {aspirant.deptName ?? "No dept"}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-poppins truncate">
                      {aspirant.facultyName ?? "—"}
                    </p>
                  </div>

                  {/* CBT */}
                  <div className="hidden lg:flex items-center gap-1 shrink-0">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-bold font-cabin text-zinc-400">
                      {aspirant.cbtAttempts ?? 0} attempts
                    </span>
                  </div>

                  {/* Date */}
                  <span className="hidden lg:block text-[10px] text-zinc-400 font-poppins shrink-0">
                    {aspirant.createdAt
                      ? new Date(aspirant.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })
                      : "—"}
                  </span>

                  {/* Status */}
                  <div className="shrink-0">
                    <StatusBadge status={aspirant.verificationStatus} />
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-10 py-5 border-t border-zinc-50 dark:border-zinc-900 flex items-center justify-between">
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
      </div>
    </>
  );
};

export default AspirantManagement;
