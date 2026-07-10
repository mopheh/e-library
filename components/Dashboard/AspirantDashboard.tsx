"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StudyCarousel from "./StudyCarousel";

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

// ── KPI Card ──────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-zinc-900 rounded-[1.5rem] p-5 shadow-sm border border-zinc-50 dark:border-zinc-800/60 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">{label}</p>
        <p className="text-2xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none mt-0.5">
          {value}
        </p>
        {sub && <p className="text-[10px] text-zinc-400 font-poppins mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────
export default function AspirantDashboard() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  React.useEffect(() => {
    fetch("/api/aspirant/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  if (!isLoaded)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const subjects = stats?.subjectCombinations ?? [];

  return (
    <div className="flex-1 p-5 md:p-8 pt-4 space-y-8 min-h-screen font-poppins bg-zinc-50/50 dark:bg-zinc-950">

      {/* ── Greeting Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-6">
        {/* Left: avatar + name */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-indigo-500 to-violet-600">
            {user?.imageUrl ? (
              <Image src={user.imageUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black font-cabin text-lg">
                {user?.firstName?.charAt(0) ?? "A"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-zinc-400 font-poppins uppercase tracking-widest">{greeting}</p>
            <h1 className="text-xl md:text-2xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 leading-tight truncate">
              {user?.firstName ?? "Aspirant"}&apos;s Dashboard
            </h1>
          </div>
        </div>

        {/* Right: actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/cbt"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-black font-cabin text-[10px] uppercase tracking-widest shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
          >
            <Brain className="w-3.5 h-3.5" />
            CBT Practice
          </Link>
          <Link
            href="/verify"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
          >
            <Award className="w-3.5 h-3.5" />
            Verify Admission
          </Link>
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="CBT Sessions"
          value={statsLoading ? "—" : stats?.totalAttempts ?? 0}
          sub="total sessions taken"
          icon={BarChart2}
          accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          delay={0}
        />
        <KpiCard
          label="Avg Score"
          value={statsLoading ? "—" : `${stats?.averageScore ?? 0}%`}
          sub="across all sessions"
          icon={TrendingUp}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          delay={0.06}
        />
        <KpiCard
          label="Best Score"
          value={statsLoading ? "—" : `${stats?.bestScore ?? 0}%`}
          sub="personal record"
          icon={Zap}
          accent="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          delay={0.12}
        />
        <KpiCard
          label="Study Streak"
          value={statsLoading ? "—" : stats?.streak ?? 0}
          sub={stats?.streak === 1 ? "day in a row" : "days in a row"}
          icon={Flame}
          accent="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          delay={0.18}
        />
      </div>

      {/* ── Carousel + Claim Your Future ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <StudyCarousel />
        </div>
        <div className="lg:col-span-4">
          <div className="glass-card p-8 h-full rounded-[2rem] flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white border-none shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
            {/* Glow orbs */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-black font-cabin tracking-tighter mb-2">Claim Your Future</h3>
              <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                Verify your admission letter and unlock premium department resources, past questions, and more.
              </p>
            </div>

            <div className="relative z-10 mt-6 space-y-3">
              <Link href="/verify">
                <button className="w-full bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black font-cabin text-sm hover:bg-indigo-50 hover:scale-[1.02] transition-all shadow-xl active:scale-95">
                  Verify Admission →
                </button>
              </Link>
              <Link href="/connect">
                <button className="w-full bg-white/10 border border-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all backdrop-blur-sm">
                  Talk to a Student
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* ── Subject Combinations (left 2/3) ─── */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-sm border border-zinc-50 dark:border-zinc-800/60">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">
                  JAMB Combination
                </p>
                <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Your Subject Combination
                </h2>
              </div>
              {subjects.length > 0 && (
                <Link href="/cbt">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-black font-cabin uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </Link>
              )}
            </div>

            {statsLoading ? (
              <div className="grid gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : subjects.length > 0 ? (
              <div className="grid gap-3">
                {subjects.map((subject, i) => {
                  const accent = subjectAccent(subject);
                  return (
                    <Link key={i} href={`/cbt`}>
                      <motion.div
                        variants={itemVariants}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:bg-white dark:hover:bg-zinc-800 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                      >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${accent.icon}`}>
                          <BookOpen className="w-5 h-5" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate">
                            {subjectLabel(subject)}
                          </h4>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {i === 0 ? "Compulsory" : "Elective"}
                          </span>
                        </div>

                        {/* Practice CTA */}
                        <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-black font-cabin text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                          Practice <ArrowRight className="w-3 h-3" />
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-sm font-bold text-zinc-500 mb-1">No subjects configured yet</p>
                <p className="text-xs text-zinc-400 mb-5">Set your JAMB combination to personalize your CBT practice</p>
                <Link href="/cbt">
                  <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black font-cabin uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                    Set Up Subjects
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* ── Recent CBT Attempts ─────── */}
          {stats && stats.recentAttempts.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-sm border border-zinc-50 dark:border-zinc-800/60">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">Performance</p>
              <h2 className="text-xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-6">Recent Sessions</h2>
              <div className="space-y-3">
                {stats.recentAttempts.map((attempt, i) => {
                  const pct = attempt.score !== null ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
                  const isPassing = pct >= 50;
                  return (
                    <div key={attempt.id} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-cabin text-sm shrink-0 ${isPassing ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                        {pct}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          Session #{i + 1} — {attempt.score}/{attempt.totalQuestions} correct
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {new Date(attempt.completedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      {/* Score bar */}
                      <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden shrink-0">
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
          )}
        </motion.div>

        {/* ── Right Column ──────────────────── */}
        <motion.div variants={itemVariants} className="space-y-6">

          {/* ── CBT Launcher ─────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-7 shadow-sm border border-zinc-50 dark:border-zinc-800/60 relative overflow-hidden group">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-1">CBT Engine</p>
              <h3 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2">
                Post-UTME Simulator
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                Timed mock exams built from real past questions across your JAMB subjects.
              </p>
              <Link href="/cbt">
                <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-black font-cabin uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95">
                  <Play className="w-4 h-4 fill-current" />
                  Start Practice
                </button>
              </Link>
            </div>
          </div>

          {/* ── Connect ─────── */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-7 shadow-sm border border-zinc-50 dark:border-zinc-800/60">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-5">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-1">Mentorship</p>
            <h3 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2">
              Connect with Students
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
              Talk to undergrads studying your intended course. Ask about exams, campus life, and admission tips.
            </p>
            <Link href="/connect">
              <button className="w-full bg-emerald-600 text-white py-3 rounded-2xl text-sm font-black font-cabin uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-colors active:scale-95">
                Find a Mentor
              </button>
            </Link>
          </div>

          {/* ── Premium Locked ─────── */}
          <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] p-7 shadow-sm border border-zinc-50 dark:border-zinc-800/60 overflow-hidden">
            {/* Blur overlay */}
            <div className="absolute inset-0 backdrop-blur-[4px] bg-white/50 dark:bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center rounded-[2rem]">
              <div className="w-14 h-14 bg-white dark:bg-zinc-800 shadow-xl rounded-3xl flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-700/50">
                <Lock className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="font-black font-cabin text-base text-zinc-900 dark:text-zinc-100 mb-1">Premium Resources</h3>
              <p className="text-xs text-zinc-500 mb-5 font-medium">Available after admission verification</p>
              <Link href="/verify">
                <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-2xl text-xs font-black font-cabin uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl">
                  Verify Now
                </button>
              </Link>
            </div>

            {/* Mock content underneath */}
            <div className="opacity-20 select-none blur-[2px] pointer-events-none">
              <h4 className="font-bold text-sm mb-3 text-zinc-800 dark:text-zinc-200">Department Materials</h4>
              <div className="space-y-3">
                <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                <div className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
              </div>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}
