"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Lock,
  PlayCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  Brain,
  Target,
  Flame,
  BarChart2,
  Trophy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import UpgradePromptModal from "./UpgradePromptModal";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

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

function ScoreRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent >= 60 ? "#22c55e" : percent >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xl font-bold fill-zinc-900 dark:fill-white"
        style={{ fontSize: "18px", transform: "rotate(90deg)", transformOrigin: "50% 50%" }}
      >
        {percent}%
      </text>
    </svg>
  );
}

export default function StudyRoadmap() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aspirant/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError("Failed to load stats");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Derive milestone stage from actual attempts + score
  const getStage = (stats: Stats) => {
    if (stats.totalAttempts === 0) return 0; // Not started
    if (stats.totalAttempts < 3) return 1;   // Just started
    if (stats.averageScore < 40) return 2;   // Needs work
    if (stats.averageScore < 60) return 3;   // Making progress
    return 4;                                 // On track
  };

  const roadmapStages = [
    {
      id: 1,
      title: "First Practice Session",
      description: "Complete your first UTME mock test to get started.",
      status: (s: Stats) => s.totalAttempts >= 1 ? "completed" : "current",
      tasks: [
        { type: "CBT", name: "First Mock Test", locked: false },
        { type: "Material", name: "Understand Your JAMB Subjects", locked: false },
      ],
    },
    {
      id: 2,
      title: "Building Momentum",
      description: "Complete at least 3 practice sessions to build your foundation.",
      status: (s: Stats) => s.totalAttempts >= 3 ? "completed" : s.totalAttempts >= 1 ? "current" : "upcoming",
      tasks: [
        { type: "CBT", name: "Practice Sessions (3 required)", locked: false },
        { type: "Material", name: "Review Your Weak Subjects", locked: false },
      ],
    },
    {
      id: 3,
      title: "Score Optimization",
      description: "Achieve an average score of 60% or higher across your sessions.",
      status: (s: Stats) => s.averageScore >= 60 && s.totalAttempts >= 3 ? "completed" : s.totalAttempts >= 3 ? "current" : "upcoming",
      tasks: [
        { type: "CBT", name: "Intensive Mock Training", locked: false },
        { type: "CBT", name: "Subject-Focused Deep Dives", locked: false },
        { type: "Material", name: "Exam Strategy Review", locked: true },
      ],
    },
    {
      id: 4,
      title: "Post-UTME Ready",
      description: "Sustain above 70% average score and maintain a daily streak.",
      status: (s: Stats) => s.averageScore >= 70 && s.streak >= 3 ? "completed" : s.averageScore >= 60 ? "current" : "upcoming",
      tasks: [
        { type: "CBT", name: "Full Simulation (100 Questions)", locked: true },
        { type: "Video", name: "Exam Day Strategies", locked: true },
        { type: "Material", name: "Final Mental Prep", locked: true },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-zinc-500">{error}</p>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const s = stats!;
  const stage = getStage(s);
  const overallProgress = Math.min(100, Math.round((stage / 4) * 100));

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">
            <Brain className="w-4 h-4" /> UTME Prep Journey
          </div>
          <h1 className="text-3xl font-bold font-open-sans">Study Roadmap</h1>
          <p className="text-zinc-500 mt-1">Your personalized path to acing the Post-UTME.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-blue-600 transition-colors"
            title="Refresh stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex gap-4 shadow-sm">
            <div>
              <div className="text-sm text-zinc-500 mb-1">Overall Progress</div>
              <div className="flex items-center gap-3">
                <Progress value={overallProgress} className="h-2 w-28 bg-zinc-100 dark:bg-zinc-800" />
                <span className="font-bold">{overallProgress}%</span>
              </div>
            </div>
            <div className="w-px bg-zinc-200 dark:bg-zinc-800" />
            <div>
              <div className="text-sm text-zinc-500 mb-1">Daily Streak</div>
              <div className={`flex items-center gap-2 font-bold ${s.streak > 0 ? "text-orange-500" : "text-zinc-400"}`}>
                <Flame className="w-4 h-4" />
                {s.streak > 0 ? `${s.streak} Day${s.streak !== 1 ? "s" : ""}` : "Not Started"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Practice Sessions", value: s.totalAttempts, icon: Target, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Average Score", value: `${s.averageScore}%`, icon: BarChart2, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Best Score", value: `${s.bestScore}%`, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Day Streak", value: s.streak, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roadmap Timeline */}
        <div className="lg:col-span-2">
          <div className="max-w-2xl space-y-6 relative">
            {/* Vertical line */}
            <div className="absolute left-[28px] top-10 bottom-10 w-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full z-0 hidden sm:block" />

            {roadmapStages.map((phase, idx) => {
              const status = phase.status(s);
              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative z-10 flex flex-col sm:flex-row gap-4 items-start"
                >
                  {/* Timeline marker */}
                  <div className="hidden sm:flex flex-col items-center shrink-0 w-14">
                    <div
                      className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-base bg-white dark:bg-zinc-900 ${
                        status === "completed"
                          ? "border-green-500 text-green-500"
                          : status === "current"
                          ? "border-blue-500 text-blue-500"
                          : "border-zinc-300 dark:border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {status === "completed" ? <CheckCircle className="w-6 h-6" /> : phase.id}
                    </div>
                  </div>

                  {/* Mobile badge */}
                  <div className="sm:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    Stage {phase.id}
                  </div>

                  {/* Card */}
                  <div
                    className={`flex-1 w-full bg-white dark:bg-zinc-900 border rounded-3xl p-5 shadow-sm ${
                      status === "current"
                        ? "border-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-lg font-bold font-open-sans">{phase.title}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${
                          status === "completed"
                            ? "bg-green-100 text-green-700"
                            : status === "current"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">{phase.description}</p>

                    <div className="space-y-2">
                      {phase.tasks.map((task, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-2xl border ${
                            task.locked
                              ? "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 opacity-60"
                              : "border-zinc-100 dark:border-zinc-800 hover:border-blue-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                              task.locked
                                ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800"
                                : status === "completed"
                                ? "bg-green-100 text-green-600"
                                : "bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {task.locked ? (
                              <Lock className="w-4 h-4" />
                            ) : status === "completed" ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : task.type === "Material" ? (
                              <FileText className="w-4 h-4" />
                            ) : task.type === "Video" ? (
                              <PlayCircle className="w-4 h-4" />
                            ) : (
                              <Brain className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="font-semibold text-sm">{task.name}</div>
                            <div className="text-xs text-zinc-500">{task.type}</div>
                          </div>

                          {!task.locked && (
                            <Link href={task.type === "CBT" ? "/cbt" : "#"}>
                              <button className="text-blue-600 dark:text-blue-400 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </Link>
                          )}
                          {task.locked && (
                            <button
                              onClick={() => setShowUpgradeModal(true)}
                              className="text-zinc-400 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Performance Snapshot */}
        <div className="space-y-6">
          {/* Score Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm text-center"
          >
            <h3 className="font-bold text-lg font-open-sans mb-4">Performance Score</h3>
            <div className="flex justify-center mb-4">
              <ScoreRing percent={s.averageScore} />
            </div>
            <p className="text-sm text-zinc-500">
              {s.totalAttempts === 0
                ? "Take your first CBT session to see your score here."
                : s.averageScore >= 60
                ? "Great performance! Keep pushing for 70%+."
                : "Keep practicing to improve your average score."}
            </p>
            <Link href="/cbt">
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-blue-500/20">
                {s.totalAttempts === 0 ? "Start First Session" : "Practice Now"}
              </button>
            </Link>
          </motion.div>

          {/* Recent Attempts */}
          {s.recentAttempts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              <h3 className="font-bold text-base font-open-sans mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" /> Recent Sessions
              </h3>
              <div className="space-y-3">
                {s.recentAttempts.map((attempt, i) => {
                  const pct = attempt.totalQuestions > 0 && attempt.score !== null
                    ? Math.round((attempt.score / attempt.totalQuestions) * 100)
                    : 0;
                  return (
                    <div key={attempt.id} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          pct >= 60 ? "bg-green-100 text-green-700" : pct >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <Progress
                          value={pct}
                          className={`h-1.5 bg-zinc-100 dark:bg-zinc-800 ${pct >= 60 ? "[&>div]:bg-green-500" : pct >= 40 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                          <span>{attempt.score}/{attempt.totalQuestions} correct</span>
                          <span className="font-semibold">{pct}%</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-400 whitespace-nowrap">
                        {attempt.completedAt ? formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true }) : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {s.recentAttempts.length === 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
              <Brain className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
              <h4 className="font-bold text-sm">No Sessions Yet</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Start a CBT session to track your progress here.
              </p>
            </div>
          )}
        </div>
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
