"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Target,
  Users,
  Lock,
  Award,
  Brain,
  TrendingUp,
  Flame,
  BarChart2,
  Zap,
  Pencil,
  ArrowRight,
  Play,
  Bell,
  Sparkles,
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import MobileStudyCarousel from "./MobileStudyCarousel";

// ── Types ─────────────────────────────────────────────────────────────
interface Stats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  streak: number;
  subjectCombinations: string[];
  recentAttempts: { id: string; score: number | null; totalQuestions: number; completedAt: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────
const subjectLabel = (s: string) => {
  const map: Record<string, string> = {
    english: "Use of English",
    mathematics: "Mathematics",
    commerce: "Commerce",
    accounting: "Accounting",
    biology: "Biology",
    physics: "Physics",
    chemistry: "Chemistry",
    englishlit: "Literature in English",
    government: "Government",
    crk: "Christian R.K.",
    geography: "Geography",
    economics: "Economics",
    history: "History",
    irk: "Islamic R.K.",
    civiledu: "Civic Education",
    insurance: "Insurance",
    currentaffairs: "Current Affairs",
  };
  return map[s] ?? s.charAt(0).toUpperCase() + s.slice(1);
};

const subjectAccent = (s: string) => {
  const map: Record<string, { bg: string; icon: string; glow: string }> = {
    english: { bg: "from-blue-500 to-indigo-600", icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", glow: "shadow-blue-200 dark:shadow-none" },
    mathematics: { bg: "from-violet-500 to-purple-600", icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400", glow: "shadow-violet-200 dark:shadow-none" },
    physics: { bg: "from-cyan-500 to-blue-600", icon: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400", glow: "shadow-cyan-200 dark:shadow-none" },
    chemistry: { bg: "from-emerald-500 to-teal-600", icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", glow: "shadow-emerald-200 dark:shadow-none" },
    biology: { bg: "from-green-500 to-emerald-600", icon: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", glow: "shadow-green-200 dark:shadow-none" },
    economics: { bg: "from-amber-500 to-orange-600", icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", glow: "shadow-amber-200 dark:shadow-none" },
    commerce: { bg: "from-orange-500 to-red-500", icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", glow: "shadow-orange-200 dark:shadow-none" },
    government: { bg: "from-rose-500 to-pink-600", icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400", glow: "shadow-rose-200 dark:shadow-none" },
  };
  return map[s] ?? { bg: "from-zinc-500 to-zinc-700", icon: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", glow: "shadow-zinc-200 dark:shadow-none" };
};

// ── Mobile Header Component ───────────────────────────────────────────
function MobileAspirantHeader({ streak }: { streak: number }) {
  const { user, isLoaded } = useUser();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = isLoaded ? (user?.firstName ?? "Aspirant") : null;

  return (
    <div className="px-5 pt-safe-or-6 pb-4 space-y-4" style={{ paddingTop: "max(24px, env(safe-area-inset-top))" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Avatar + Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative w-11 h-11 rounded-2xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600"
          >
            {isLoaded && user?.imageUrl ? (
              <Image src={user.imageUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black font-cabin text-base">
                {firstName?.charAt(0) ?? "A"}
              </div>
            )}
          </motion.div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-505 font-poppins uppercase tracking-widest leading-none mb-0.5">
              {greeting}
            </p>
            <p className="text-[17px] font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight truncate">
              {firstName ?? (
                <span className="inline-block w-24 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 shrink-0">
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40"
            >
              <span className="text-sm leading-none">🔥</span>
              <span className="text-[11px] font-black font-cabin text-amber-600 dark:text-amber-400">{streak}</span>
            </motion.div>
          )}

          <Link
            href="/dashboard/ai"
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-2 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI
          </Link>

          <Link href="/dashboard/notifications">
            <button className="relative w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:scale-95">
              <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse" />
            </button>
          </Link>
        </div>
      </div>

      {/* Search Hint Bar */}
      <Link href="/library" className="block">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors active:scale-[0.98]">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-505 shrink-0" />
          <span className="text-sm text-zinc-400 dark:text-zinc-505 font-poppins select-none">
            Search syllabus, mock materials...
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[9px] font-black font-cabin uppercase tracking-widest text-zinc-300 dark:text-zinc-600 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
              AI
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Mini KPI Strip for Aspirants ─────────────────────────────────────
function MobileAspirantKPIStrip({ stats, isLoading }: { stats: Stats | null; isLoading: boolean }) {
  const kpiItems = [
    {
      icon: BarChart2,
      value: stats?.totalAttempts ?? 0,
      label: "CBT Mocks",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      icon: TrendingUp,
      value: stats?.averageScore ? `${stats.averageScore}%` : "0%",
      label: "Avg Score",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      icon: Zap,
      value: stats?.bestScore ? `${stats.bestScore}%` : "0%",
      label: "Best Score",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: Flame,
      value: `${stats?.streak ?? 0}d`,
      label: "Streak",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 mx-5">
      {kpiItems.map(({ icon: Icon, value, label, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl ${bg} border border-transparent`}
        >
          {isLoading ? (
            <div className="w-10 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ) : (
            <>
              <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
              <span className={`text-base font-black font-cabin leading-none ${color}`}>
                {value}
              </span>
              <span className="text-[8px] font-bold font-cabin uppercase tracking-wide text-zinc-400 dark:text-zinc-505 text-center leading-none px-1">
                {label}
              </span>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────
function AspirantQuickActions() {
  const actions = [
    {
      icon: Play,
      label: "CBT Mock",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      border: "border-indigo-200 dark:border-indigo-800/40",
      href: "/cbt",
    },
    {
      icon: Sparkles,
      label: "AI Tutor",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-900/30",
      border: "border-violet-200 dark:border-violet-800/40",
      href: "/dashboard/ai",
    },
    {
      icon: Users,
      label: "Mentors",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-800/40",
      href: "/connect",
    },
    {
      icon: Award,
      label: "Verify",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-900/30",
      border: "border-rose-200 dark:border-rose-800/40",
      href: "/verify",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <Link
            href={action.href}
            className={`flex flex-col items-center gap-2.5 p-3 rounded-2xl border ${action.border} ${action.bg} hover:scale-[1.04] active:scale-95 transition-all duration-200 group`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm border border-inherit group-hover:shadow-md transition-shadow">
              <action.icon className={`w-5 h-5 ${action.color}`} strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className={`text-[9px] font-black font-cabin uppercase tracking-wider ${action.color}`}>
                {action.label}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────
export default function MobileAspirantDashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/aspirant/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const subjects = stats?.subjectCombinations ?? [];

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins"
      style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}
    >
      {/* 0. Sticky Header */}
      <div className="sticky top-0 z-30 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-transparent">
        <MobileAspirantHeader streak={stats?.streak ?? 0} />
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-7 pt-2">
        {/* 1. Carousel Section */}
        <section className="px-5">
          <MobileStudyCarousel />
        </section>

        {/* 2. KPI Stats */}
        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-505 font-cabin px-5 mb-3">
            Exam Metrics
          </p>
          <MobileAspirantKPIStrip stats={stats} isLoading={statsLoading} />
        </section>

        {/* 3. Quick Actions */}
        <section className="px-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-505 font-cabin mb-3">
            Quick Access
          </p>
          <AspirantQuickActions />
        </section>

        {/* 4. Subject Combination */}
        <section className="px-5">
          <div className="bg-white dark:bg-zinc-900 rounded-[22px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-500" />
                Your JAMB Combination
              </h2>
              {subjects.length > 0 && (
                <Link href="/cbt">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-black font-cabin uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Pencil className="w-2.5 h-2.5" /> Edit
                  </button>
                </Link>
              )}
            </div>

            {statsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : subjects.length > 0 ? (
              <div className="space-y-2">
                {subjects.map((subject, i) => {
                  const accent = subjectAccent(subject);
                  return (
                    <Link key={i} href={`/cbt`}>
                      <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all shadow-sm">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.icon}`}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 truncate">
                            {subjectLabel(subject)}
                          </h4>
                          <span className="text-[8px] font-black tracking-widest text-zinc-400 uppercase">
                            {i === 0 ? "Compulsory" : "Elective"}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Target className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-500 mb-1">No subjects configured</p>
                <p className="text-[10px] text-zinc-400 mb-4 px-4">Set your JAMB combination to practice</p>
                <Link href="/cbt">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black font-cabin uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-sm">
                    Configure
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 5. Claim Your Future */}
        <section className="px-5">
          <div className="p-6 rounded-[22px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
            <div className="relative z-10 mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black font-cabin tracking-tight mb-1">Claim Your Future</h3>
              <p className="text-[11px] text-indigo-100 font-medium leading-relaxed">
                Verify your admission letter and unlock premium department resources, past questions, and more.
              </p>
            </div>
            <div className="relative z-10 flex flex-col gap-2">
              <Link href="/verify" className="w-full">
                <button className="w-full bg-white text-indigo-600 py-2.5 rounded-xl font-black font-cabin text-xs hover:bg-indigo-50 transition-all shadow-md active:scale-95">
                  Verify Admission
                </button>
              </Link>
              <Link href="/connect" className="w-full">
                <button className="w-full bg-white/10 border border-white/20 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-white/20 transition-all">
                  Talk to a Student
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* 6. Recent CBT Attempts */}
        {stats && stats.recentAttempts.length > 0 && (
          <section className="px-5">
            <div className="bg-white dark:bg-zinc-900 rounded-[22px] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800/60">
              <h2 className="text-sm font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                Recent Mock Attempts
              </h2>
              <div className="space-y-2.5">
                {stats.recentAttempts.map((attempt, i) => {
                  const pct = attempt.score !== null ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
                  const isPassing = pct >= 50;
                  return (
                    <div key={attempt.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-transparent">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black font-cabin text-xs shrink-0 ${isPassing ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                        {pct}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          Session #{i + 1} — {attempt.score}/{attempt.totalQuestions}
                        </p>
                        <p className="text-[9px] text-zinc-400">
                          {new Date(attempt.completedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all ${isPassing ? "bg-emerald-500" : "bg-rose-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 7. Post-UTME Simulator Card & Mentorship Card */}
        <section className="grid grid-cols-2 gap-4 px-5">
          {/* UTME Simulator */}
          <div className="bg-white dark:bg-zinc-900 rounded-[22px] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800/60 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center mb-3.5 shadow-md shadow-indigo-500/20">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
                Post-UTME Mock
              </h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">
                Timed mock exams based on real syllabus questions.
              </p>
            </div>
            <Link href="/cbt" className="w-full">
              <button className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10">
                <Play className="w-3 h-3 fill-current" />
                Start Mock
              </button>
            </Link>
          </div>

          {/* Mentorship */}
          <div className="bg-white dark:bg-zinc-900 rounded-[22px] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800/60 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-3.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xs font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
                Find a Mentor
              </h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">
                Talk to undergrads studying your course.
              </p>
            </div>
            <Link href="/connect" className="w-full">
              <button className="w-full bg-emerald-600 text-white py-2 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/10">
                Find Mentor
              </button>
            </Link>
          </div>
        </section>

        {/* 8. Locked Premium Resources */}
        <section className="px-5">
          <div className="relative bg-white dark:bg-zinc-900 rounded-[22px] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800/60 overflow-hidden">
            {/* Blur Overlay */}
            <div className="absolute inset-0 backdrop-blur-[3px] bg-white/60 dark:bg-black/60 z-10 flex flex-col items-center justify-center p-4 text-center rounded-[22px]">
              <div className="w-10 h-10 bg-white dark:bg-zinc-800 shadow-lg rounded-xl flex items-center justify-center mb-2 border border-zinc-100 dark:border-zinc-700/50">
                <Lock className="w-4 h-4 text-zinc-400" />
              </div>
              <h3 className="font-black font-cabin text-xs text-zinc-900 dark:text-zinc-100 mb-0.5">Premium Resources</h3>
              <p className="text-[9px] text-zinc-500 mb-3">Available after admission verification</p>
              <Link href="/verify">
                <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-1.5 rounded-xl text-[9px] font-black font-cabin uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-md">
                  Verify Now
                </button>
              </Link>
            </div>

            {/* Blurred Mock Content */}
            <div className="opacity-25 select-none blur-[1.5px] pointer-events-none">
              <h4 className="font-bold text-xs mb-2 text-zinc-800 dark:text-zinc-200">Department Materials</h4>
              <div className="space-y-2">
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
