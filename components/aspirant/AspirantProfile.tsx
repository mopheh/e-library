"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Target,
  BookOpen,
  Trophy,
  Flame,
  BarChart2,
  CheckCircle,
  Clock,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
  Loader2,
  TrendingUp,
  Brain,
  Shield,
  User,
  Star,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Progress } from "@/components/ui/progress";
import UpgradePromptModal from "./UpgradePromptModal";

type RecentAttempt = {
  id: string;
  score: number | null;
  totalQuestions: number;
  completedAt: string | null;
};

type Stats = {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  streak: number;
  intendedDepartmentId: string | null;
  subjectCombinations: string[];
  recentAttempts: RecentAttempt[];
};

type VerificationStatus = {
  status: "pending" | "approved" | "rejected" | null;
  submittedAt?: string | null;
};

function ScoreRing({ percent }: { percent: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 60 ? "#22c55e" : percent >= 40 ? "#f59e0b" : percent > 0 ? "#ef4444" : "#d1d5db";

  return (
    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        className="text-zinc-100 dark:text-zinc-800"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-zinc-900 dark:fill-white"
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          transform: "rotate(90deg)",
          transformOrigin: "50% 50%",
        }}
      >
        {percent}%
      </text>
    </svg>
  );
}

const SUBJECT_DISPLAY: Record<string, string> = {
  englishlit: "Literature",
  civiledu: "Civic Education",
  crk: "C.R.K",
  irk: "I.R.K",
  currentaffairs: "Current Affairs",
  mathematics: "Mathematics",
  commerce: "Commerce",
  accounting: "Accounting",
  biology: "Biology",
  physics: "Physics",
  chemistry: "Chemistry",
  government: "Government",
  geography: "Geography",
  economics: "Economics",
  history: "History",
  insurance: "Insurance",
  english: "Use of English",
};

function formatSubject(sub: string) {
  return SUBJECT_DISPLAY[sub.toLowerCase()] || sub.charAt(0).toUpperCase() + sub.slice(1);
}

export default function AspirantProfile() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [verification, setVerification] = useState<VerificationStatus>({ status: null });
  const [loading, setLoading] = useState(true);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, verifyRes] = await Promise.all([
        fetch("/api/aspirant/stats"),
        fetch("/api/aspirant/verify"),
      ]);
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const verifyData = await verifyRes.json();
      if (verifyData && verifyData.requests && verifyData.requests.length > 0) {
        const latest = verifyData.requests[verifyData.requests.length - 1];
        setVerification({ status: latest.status || "pending", submittedAt: latest.createdAt });
      } else {
        setVerification({ status: null });
      }
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const s = stats;
  const joinDate = user?.createdAt ? new Date(user.createdAt) : null;

  const verificationBadge = () => {
    if (verification.status === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold">
          <BadgeCheck className="w-3.5 h-3.5" /> Verified Student
        </span>
      );
    }
    if (verification.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" /> Verification Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 text-xs font-bold">
        <Shield className="w-3.5 h-3.5" /> Aspirant
      </span>
    );
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins space-y-8">

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950 border border-zinc-800 text-white p-8 md:p-10 shadow-2xl"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/10 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 border-2 border-zinc-900 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {verificationBadge()}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium border border-white/10">
                <GraduationCap className="w-3.5 h-3.5" /> UTME Aspirant
              </span>
            </div>
            <h1 className="text-3xl font-bold font-cabin tracking-tight truncate">
              {user?.fullName || "Aspirant"}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">{user?.emailAddresses?.[0]?.emailAddress}</p>
            {joinDate && (
              <p className="text-zinc-500 text-xs mt-1">
                Joined {joinDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Refresh + CTA */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
              title="Refresh profile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {!verification.status && (
              <Link href="/verify">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/30">
                  Verify Admission <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
            {verification.status === "pending" && (
              <Link href="/verify">
                <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
                  <Clock className="w-4 h-4" /> View Status
                </button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Practice Sessions",
            value: s?.totalAttempts ?? 0,
            icon: Target,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Average Score",
            value: `${s?.averageScore ?? 0}%`,
            icon: BarChart2,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-900/20",
          },
          {
            label: "Best Score",
            value: `${s?.bestScore ?? 0}%`,
            icon: Trophy,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20",
          },
          {
            label: "Day Streak",
            value: s?.streak ?? 0,
            icon: Flame,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-900/20",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Subject Combos + Recent Attempts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Subject Combinations */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-cabin flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> JAMB Subject Combinations
              </h2>
              {(!s?.subjectCombinations || s.subjectCombinations.length === 0) && (
                <Link href="/cbt">
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                    Set Subjects <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              )}
            </div>

            {s?.subjectCombinations && s.subjectCombinations.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {s.subjectCombinations.map((sub, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{formatSubject(sub)}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                        {i === 0 ? "Compulsory" : "Elective"}
                      </div>
                    </div>
                    {i === 0 && <CheckCircle className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Brain className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h4 className="font-bold text-sm mb-1">No Subjects Set Yet</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Set up your JAMB subject combinations to start CBT practice.
                </p>
                <Link href="/cbt">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors">
                    Go to CBT Setup
                  </button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Recent Attempts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-cabin flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" /> Recent CBT Sessions
              </h2>
              <Link href="/cbt">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                  Practice Now <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {s && s.recentAttempts.length > 0 ? (
              <div className="space-y-4">
                {s.recentAttempts.map((attempt, i) => {
                  const pct =
                    attempt.totalQuestions > 0 && attempt.score !== null
                      ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                      : 0;
                  const color =
                    pct >= 60 ? "text-green-700 bg-green-100" : pct >= 40 ? "text-amber-700 bg-amber-100" : "text-red-700 bg-red-100";
                  return (
                    <div key={attempt.id} className="flex items-center gap-4">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-medium">
                            {attempt.score ?? 0}/{attempt.totalQuestions} correct
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
                            {pct}%
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-1.5 bg-zinc-100 dark:bg-zinc-800"
                        />
                        {attempt.completedAt && (
                          <p className="text-[10px] text-zinc-400 mt-1">
                            {new Date(attempt.completedAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Trophy className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h4 className="font-bold text-sm mb-1">No Sessions Yet</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Start your first CBT practice session to track your progress here.
                </p>
                <Link href="/cbt">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors">
                    Start Practice
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Score Ring + Quick Actions + Verification */}
        <div className="space-y-6">

          {/* Performance Score Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm text-center"
          >
            <h3 className="font-bold text-lg font-cabin mb-4">Performance Score</h3>
            <div className="flex justify-center mb-3">
              <ScoreRing percent={s?.averageScore ?? 0} />
            </div>
            <p className="text-sm text-zinc-500">
              {!s || s.totalAttempts === 0
                ? "Take your first CBT session to see your score."
                : s.averageScore >= 60
                ? "Great performance! Keep pushing for 70%+."
                : "Keep practising to improve your average score."}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm font-semibold">
              <Flame className={`w-4 h-4 ${(s?.streak ?? 0) > 0 ? "text-orange-500" : "text-zinc-300"}`} />
              <span className={(s?.streak ?? 0) > 0 ? "text-orange-500" : "text-zinc-400"}>
                {(s?.streak ?? 0) > 0 ? `${s!.streak} Day Streak 🔥` : "No active streak"}
              </span>
            </div>
          </motion.div>

          {/* Verification Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`rounded-3xl p-6 border shadow-sm ${
              verification.status === "approved"
                ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                : verification.status === "pending"
                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                : "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none"
            }`}
          >
            {verification.status === "approved" ? (
              <>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <BadgeCheck className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-green-900 dark:text-green-300 mb-1">Verified!</h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your admission has been verified. You now have full student access to all premium resources.
                </p>
              </>
            ) : verification.status === "pending" ? (
              <>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-lg text-amber-900 dark:text-amber-300 mb-1">Under Review</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                  Your verification request is being reviewed. Allow 24–48 hours for approval.
                </p>
                <Link href="/verify">
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">
                    View Status
                  </button>
                </Link>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-2">Get Verified</h3>
                <p className="text-blue-100 text-sm mb-5 leading-relaxed">
                  Verify your admission to unlock premium department resources, lecture notes, and past questions.
                </p>
                <Link href="/verify">
                  <button className="w-full bg-white text-blue-600 hover:bg-blue-50 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                    Submit Verification <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <h3 className="font-bold text-base font-cabin mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: "CBT Practice", path: "/cbt", icon: Brain, desc: "Mock exam sessions" },
                { label: "Study Roadmap", path: "/roadmap", icon: Target, desc: "Your UTME journey" },
                { label: "Dept Preview", path: "/preview", icon: GraduationCap, desc: "Your target dept" },
                { label: "Connect", path: "/connect", icon: TrendingUp, desc: "Find mentors" },
              ].map((action) => (
                <Link key={action.path} href={action.path}>
                  <button className="w-full flex items-center gap-3 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all group text-left">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <action.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{action.label}</div>
                      <div className="text-[10px] text-zinc-400">{action.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors shrink-0" />
                  </button>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
