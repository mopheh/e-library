"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  BookOpen,
  Brain,
  Target,
  Flame,
  Trophy,
  RotateCcw,
  LayoutDashboard,
  AlertCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { saveCbtSubjects } from "@/actions/aspirant";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Constants ────────────────────────────────────────────────────────
const STORAGE_KEY = "univault_aspirant_cbt_session";

const ALL_SUBJECTS = [
  { value: "mathematics",   label: "Mathematics",          emoji: "📐" },
  { value: "commerce",      label: "Commerce",             emoji: "💼" },
  { value: "accounting",    label: "Accounting",           emoji: "📊" },
  { value: "biology",       label: "Biology",              emoji: "🧬" },
  { value: "physics",       label: "Physics",              emoji: "⚛️"  },
  { value: "chemistry",     label: "Chemistry",            emoji: "🧪" },
  { value: "englishlit",    label: "Literature in English",emoji: "📚" },
  { value: "government",    label: "Government",           emoji: "🏛️"  },
  { value: "crk",           label: "CRK",                  emoji: "✝️"  },
  { value: "geography",     label: "Geography",            emoji: "🌍" },
  { value: "economics",     label: "Economics",            emoji: "📈" },
  { value: "history",       label: "History",              emoji: "📜" },
  { value: "irk",           label: "IRK",                  emoji: "☪️"  },
  { value: "civiledu",      label: "Civic Education",      emoji: "🗳️"  },
  { value: "insurance",     label: "Insurance",            emoji: "🔒" },
  { value: "currentaffairs",label: "Current Affairs",      emoji: "📰" },
];

function getSubjectMeta(value: string) {
  return ALL_SUBJECTS.find((s) => s.value === value) ?? { value, label: value, emoji: "📖" };
}

// ── Types ─────────────────────────────────────────────────────────────
type Mode = "loading" | "onboarding" | "config" | "exam";

interface Question {
  id: string;
  subject: string;
  questionText?: string;
  text?: string;
  options: { optionText: string; isCorrect: boolean }[];
  explanation?: string;
}

// ── Subcomponents ─────────────────────────────────────────────────────

/** Fullscreen centred loader */
function PageLoader({ label = "Initialising..." }: { label?: string }) {
  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-4 border-indigo-300 animate-ping opacity-30" />
      </div>
      <p className="text-sm font-bold text-zinc-400 font-cabin uppercase tracking-widest animate-pulse">{label}</p>
    </div>
  );
}

// ── ONBOARDING SCREEN ─────────────────────────────────────────────────
function OnboardingScreen({
  selectedElectives,
  onToggle,
  onSave,
  isSaving,
}: {
  selectedElectives: string[];
  onToggle: (s: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header card */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-[2rem] p-8 mb-6 overflow-hidden shadow-2xl shadow-indigo-500/25">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-sm">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="inline-block bg-white/20 text-white text-[10px] font-black font-cabin uppercase tracking-widest px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
              One-time Setup
            </span>
            <h1 className="text-3xl font-black font-cabin tracking-tighter text-white mb-2">
              Set Your JAMB Subjects
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed max-w-md">
              Pick the 3 electives from your JAMB registration. Use of English is added automatically — making your total 4 subjects.
            </p>
          </div>
        </div>

        {/* White panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-xl border border-zinc-100 dark:border-zinc-800">
          {/* English (locked) */}
          <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl mb-6">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-lg font-black font-cabin shrink-0">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-black font-cabin text-emerald-800 dark:text-emerald-300">Use of English</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Compulsory for all JAMB candidates</p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          </div>

          {/* Counter */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black font-cabin text-zinc-800 dark:text-zinc-200">Select 3 Electives</h3>
            <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black font-cabin transition-colors ${selectedElectives.length === 3 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
              {selectedElectives.length}/3 Selected
            </div>
          </div>

          {/* Subject grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {ALL_SUBJECTS.map((sub) => {
              const isSelected = selectedElectives.includes(sub.value);
              return (
                <button
                  key={sub.value}
                  onClick={() => onToggle(sub.value)}
                  className={`relative p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all active:scale-95 ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-600"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                  }`}
                >
                  <span className="text-xl shrink-0">{sub.emoji}</span>
                  <span className={`text-xs font-bold leading-tight ${isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-600 dark:text-zinc-400"}`}>
                    {sub.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={onSave}
            disabled={isSaving || selectedElectives.length !== 3}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black font-cabin py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] text-sm uppercase tracking-widest"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isSaving ? "Saving…" : "Lock In & Go to Practice Hub"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── CONFIG SCREEN ──────────────────────────────────────────────────────
function ConfigScreen({
  profileCombos,
  configSubjects,
  onToggle,
  configTime,
  onTimeChange,
  configLimit,
  onLimitChange,
  onStart,
  onEditSubjects,
}: {
  profileCombos: string[];
  configSubjects: string[];
  onToggle: (s: string) => void;
  configTime: number;
  onTimeChange: (t: number) => void;
  configLimit: number;
  onLimitChange: (n: number) => void;
  onStart: () => void;
  onEditSubjects: () => void;
}) {
  const TIME_OPTS = [
    { label: "15 min", val: 900 },
    { label: "30 min", val: 1800 },
    { label: "1 Hour", val: 3600 },
    { label: "2 Hours", val: 7200 },
  ];
  const LIMIT_OPTS = [10, 20, 40];

  const totalQs = configSubjects.length * configLimit;

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins p-4 py-10 flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl space-y-5">

        {/* Page title */}
        <div className="text-center mb-2">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/25">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Configure Session</h1>
          <p className="text-sm text-zinc-500 mt-1">Customise your practice environment before launching the engine.</p>
        </div>

        {/* Subjects */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">JAMB Combination</p>
              <h2 className="text-base font-black font-cabin text-zinc-900 dark:text-zinc-50">Focus Subjects</h2>
            </div>
            <button
              onClick={onEditSubjects}
              className="text-[10px] font-black font-cabin uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Edit →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {profileCombos.map((sub) => {
              const meta = getSubjectMeta(sub);
              const isActive = configSubjects.includes(sub);
              return (
                <button
                  key={sub}
                  onClick={() => onToggle(sub)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                    isActive
                      ? "bg-indigo-50 border-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-600"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black font-cabin truncate ${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-zinc-400">{isActive ? "Included" : "Excluded"}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isActive ? "bg-indigo-500 border-indigo-500" : "border-zinc-300 dark:border-zinc-600"}`}>
                    {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Questions & Timer row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Questions per subject */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">Per Subject</p>
            <h2 className="text-base font-black font-cabin text-zinc-900 dark:text-zinc-50 mb-5">Questions</h2>
            <div className="flex gap-2">
              {LIMIT_OPTS.map((val) => (
                <button
                  key={val}
                  onClick={() => onLimitChange(val)}
                  className={`flex-1 py-3.5 font-black font-cabin text-sm rounded-2xl border-2 transition-all active:scale-95 ${
                    configLimit === val
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-300"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-7 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">Duration</p>
            <h2 className="text-base font-black font-cabin text-zinc-900 dark:text-zinc-50 mb-5">CBT Timer</h2>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTS.map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => onTimeChange(opt.val)}
                  className={`py-3 font-black font-cabin text-xs rounded-2xl border-2 transition-all active:scale-95 ${
                    configTime === opt.val
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary + Launch */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 rounded-[2rem] p-7 shadow-xl">
          <div className="flex flex-wrap gap-6 mb-6 justify-around">
            <div className="text-center">
              <p className="text-3xl font-black font-cabin text-white">{configSubjects.length}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subjects</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black font-cabin text-white">{totalQs}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Qs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black font-cabin text-white">{Math.floor(configTime / 60)}<span className="text-lg">m</span></p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Duration</p>
            </div>
          </div>
          <button
            onClick={onStart}
            disabled={configSubjects.length === 0}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black font-cabin py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/30 active:scale-[0.98] text-sm uppercase tracking-widest"
          >
            <Play className="w-5 h-5 fill-current" />
            Launch Assessment Engine
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── RESULTS SCREEN ─────────────────────────────────────────────────────
function ResultsScreen({
  questions,
  answers,
  onRetry,
  onDashboard,
}: {
  questions: Question[];
  answers: Record<string, number>;
  onRetry: () => void;
  onDashboard: () => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const score = questions.reduce(
    (acc, q) => acc + (answers[q.id] !== undefined && q.options[answers[q.id]]?.isCorrect ? 1 : 0),
    0
  );
  const pct = Math.round((score / questions.length) * 100);
  const isPassing = pct >= 50;

  const scoreColor = pct >= 70 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-rose-500";
  const scoreBg = pct >= 70 ? "from-emerald-500 to-teal-600" : pct >= 50 ? "from-amber-500 to-orange-500" : "from-rose-500 to-pink-600";
  const scoreLabel = pct >= 70 ? "Excellent!" : pct >= 50 ? "Good Effort" : "Keep Practising";

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins p-4 py-10 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl space-y-5"
      >
        {/* Score hero */}
        <div className={`relative bg-gradient-to-br ${scoreBg} rounded-[2rem] p-8 text-white text-center overflow-hidden shadow-2xl`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <p className="text-[10px] font-black font-cabin uppercase tracking-[0.2em] text-white/60 mb-1">Session Complete</p>
            <div className={`text-7xl font-black font-cabin tracking-tighter mb-1`}>{pct}%</div>
            <p className="text-xl font-bold text-white/90 mb-1">{scoreLabel}</p>
            <p className="text-sm text-white/60">{score} correct out of {questions.length} questions</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Correct", val: score, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Wrong", val: questions.length - score - questions.filter(q => answers[q.id] === undefined).length, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
            { label: "Skipped", val: questions.filter(q => answers[q.id] === undefined).length, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-[1.5rem] p-5 text-center`}>
              <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
              <p className="text-2xl font-black font-cabin text-zinc-800 dark:text-zinc-100">{val}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {/* Review Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-7 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">Breakdown</p>
            <h2 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">Answer Review</h2>
          </div>
          <div className="divide-y divide-zinc-50 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
            {questions.map((q, i) => {
              const correctIdx = q.options.findIndex((o) => o.isCorrect);
              const userIdx = answers[q.id];
              const isCorrect = userIdx !== undefined && q.options[userIdx]?.isCorrect;
              const skipped = userIdx === undefined;
              const isExpanded = expandedIdx === i;

              return (
                <button
                  key={q.id}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-4 px-7 py-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {/* Status dot */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isCorrect ? "bg-emerald-100 dark:bg-emerald-900/30" : skipped ? "bg-amber-100 dark:bg-amber-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}>
                      {isCorrect
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : skipped
                          ? <AlertCircle className="w-4 h-4 text-amber-500" />
                          : <XCircle className="w-4 h-4 text-rose-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-400 font-cabin uppercase tracking-widest mb-1">Q{i + 1} · {getSubjectMeta(q.subject).label}</p>
                      <p
                        className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: q.questionText || q.text || "" }}
                      />
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-7 pb-5 space-y-2 bg-zinc-50/50 dark:bg-zinc-800/30">
                          {q.options.map((opt, oi) => {
                            const isUserPick = userIdx === oi;
                            const isCorrectOpt = oi === correctIdx;
                            return (
                              <div
                                key={oi}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                                  isCorrectOpt
                                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/40"
                                    : isUserPick && !isCorrectOpt
                                      ? "bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800/40"
                                      : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700"
                                }`}
                              >
                                <span className={`font-black font-cabin text-xs w-5 shrink-0 ${isCorrectOpt ? "text-emerald-600" : isUserPick ? "text-rose-500" : "text-zinc-400"}`}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <span
                                  className={`flex-1 ${isCorrectOpt ? "text-emerald-700 dark:text-emerald-300 font-semibold" : isUserPick ? "text-rose-600 dark:text-rose-400" : "text-zinc-600 dark:text-zinc-400"}`}
                                  dangerouslySetInnerHTML={{ __html: opt.optionText }}
                                />
                                {isCorrectOpt && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                                {isUserPick && !isCorrectOpt && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                              </div>
                            );
                          })}
                          {q.explanation && (
                            <div className="flex gap-2 mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onDashboard}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-black font-cabin text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black font-cabin text-xs uppercase tracking-widest transition-colors shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            New Session
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── EXAM SCREEN ────────────────────────────────────────────────────────
function ExamScreen({
  questions,
  currentIdx,
  answers,
  timeLeft,
  isSyncing,
  onSelectOption,
  onPrev,
  onNext,
  onJump,
  onSubmit,
}: {
  questions: Question[];
  currentIdx: number;
  answers: Record<string, number>;
  timeLeft: number;
  isSyncing: boolean;
  onSelectOption: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
  onSubmit: () => void;
}) {
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isUrgent = timeLeft < 300;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const subjectMeta = getSubjectMeta(currentQ?.subject ?? "");

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins flex flex-col">

      {/* ── Top Bar ── */}
      <div className={`sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 transition-colors ${isUrgent ? "border-b-2 border-rose-200 dark:border-rose-900" : ""}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400">Assessment Engine</p>
            <p className="text-sm font-black font-cabin text-zinc-800 dark:text-zinc-200 truncate">{subjectMeta.emoji} {subjectMeta.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className={`flex items-center gap-2 font-mono font-black text-lg px-4 py-2 rounded-2xl transition-all ${isUrgent ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 animate-pulse" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"}`}>
            <Clock className="w-4 h-4" />
            {mm}:{ss}
          </div>

          {/* Submit */}
          <button
            onClick={() => setConfirmSubmit(true)}
            disabled={isSyncing}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md disabled:opacity-60"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit
          </button>
        </div>
      </div>

      {/* ── Progress bar (slim) ── */}
      <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">

        {/* Question area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 md:p-10 shadow-sm border border-zinc-100 dark:border-zinc-800 flex-1 flex flex-col"
            >
              {/* Q header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className={`text-[10px] font-black font-cabin uppercase tracking-widest px-3 py-1.5 rounded-full ${answers[currentQ?.id] !== undefined ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-amber-50 text-amber-500 dark:bg-amber-900/10 dark:text-amber-400"}`}>
                    {answers[currentQ?.id] !== undefined ? "Answered" : "Unanswered"}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 font-cabin">{answeredCount}/{questions.length} done</span>
              </div>

              {/* Question text */}
              <h2
                className="text-lg md:text-2xl font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed mb-10 flex-1"
                dangerouslySetInnerHTML={{ __html: currentQ?.questionText || "" }}
              />

              {/* Options */}
              <div className="space-y-3">
                {currentQ?.options?.map((opt, i) => {
                  const isSelected = answers[currentQ.id] === i;
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => onSelectOption(i)}
                      className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm shadow-indigo-500/10"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center font-black font-cabin text-sm shrink-0 transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400"
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span
                        className={`font-medium text-sm md:text-base leading-relaxed ${isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"}`}
                        dangerouslySetInnerHTML={{ __html: opt.optionText }}
                      />
                      {isSelected && <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0 ml-auto" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={onPrev}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-black font-cabin text-xs uppercase tracking-widest text-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            {/* Mobile submit */}
            <button
              onClick={() => setConfirmSubmit(true)}
              className="md:hidden flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest"
            >
              Submit
            </button>

            <button
              onClick={onNext}
              disabled={currentIdx === questions.length - 1}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black font-cabin text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 lg:sticky lg:top-24 space-y-6">

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 font-cabin">
                <span>{answeredCount} Answered</span>
                <span>{questions.length - answeredCount} Left</span>
              </div>
              <Progress value={progressPct} className="h-2 bg-zinc-100 dark:bg-zinc-800" />
              <p className="text-[10px] text-zinc-400 font-cabin mt-1.5 text-right">{Math.round(progressPct)}% complete</p>
            </div>

            {/* Question map */}
            <div>
              <p className="text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400 mb-3">Question Map</p>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = currentIdx === i;
                  return (
                    <button
                      key={q.id}
                      onClick={() => onJump(i)}
                      title={`Q${i + 1}${isAnswered ? " (answered)" : ""}`}
                      className={`aspect-square rounded-xl font-black font-cabin text-xs flex items-center justify-center transition-all active:scale-90 ${
                        isCurrent
                          ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                          : isAnswered
                            ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {[
                { color: "bg-zinc-900 dark:bg-zinc-100", label: "Answered" },
                { color: "bg-indigo-100 ring-2 ring-indigo-500", label: "Current" },
                { color: "bg-zinc-100 dark:bg-zinc-800", label: "Not answered" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-md shrink-0 ${color}`} />
                  <span className="text-[10px] text-zinc-400 font-cabin">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit confirmation modal ── */}
      <AnimatePresence>
        {confirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmSubmit(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-sm text-center"
            >
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2">Submit Assessment?</h3>
              <p className="text-sm text-zinc-500 mb-2">
                You&apos;ve answered <strong className="text-zinc-700 dark:text-zinc-300">{answeredCount}</strong> of <strong className="text-zinc-700 dark:text-zinc-300">{questions.length}</strong> questions.
              </p>
              {questions.length - answeredCount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 px-4 py-2 rounded-xl mb-6 font-medium">
                  {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} will be marked as skipped.
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmSubmit(false)} className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-black font-cabin text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  Continue
                </button>
                <button
                  onClick={() => { setConfirmSubmit(false); onSubmit(); }}
                  disabled={isSyncing}
                  className="flex-1 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black font-cabin text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ROOT COMPONENT ─────────────────────────────────────────────────────
export default function AspirantCbt() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [profileCombos, setProfileCombos] = useState<string[]>([]);

  // Onboarding
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [isSavingOnboard, setIsSavingOnboard] = useState(false);

  // Config
  const [configSubjects, setConfigSubjects] = useState<string[]>([]);
  const [configTime, setConfigTime] = useState(1800);
  const [configLimit, setConfigLimit] = useState(10);

  // Exam
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSyncing, setIsSyncing] = useState(false);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { questions: q, answers: a, timeLeft: t, currentIdx: ci, timestamp } = JSON.parse(saved);
          if (q?.length > 0) {
            const elapsed = timestamp ? Math.floor((Date.now() - timestamp) / 1000) : 0;
            const trueTime = Math.max(0, t - elapsed);
            setQuestions(q);
            setAnswers(a || {});
            setTimeLeft(trueTime);
            setCurrentIdx(ci || 0);
            if (trueTime <= 0) setIsSubmitted(true);
            setMode("exam");
            return;
          }
        }
        const res = await fetch("/api/aspirant/profile");
        const data = await res.json();
        if (data.success && data.profile?.subjectCombinations?.length > 0) {
          const combos = data.profile.subjectCombinations as string[];
          setProfileCombos(combos);
          setConfigSubjects(combos);
          setMode("config");
        } else {
          setMode("onboarding");
        }
      } catch (err) {
        console.error("CBT init error:", err);
        setMode("onboarding");
      }
    };
    init();
  }, []);

  // ── Session persistence ──
  useEffect(() => {
    if (mode === "exam" && questions.length > 0 && !isSubmitted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions, answers, timeLeft, currentIdx, timestamp: Date.now() }));
    }
  }, [questions, answers, currentIdx, timeLeft, isSubmitted, mode]);

  // ── Countdown ──
  useEffect(() => {
    if (mode !== "exam" || isSubmitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isSubmitted, timeLeft, mode]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (mode === "exam" && !isSubmitted && timeLeft === 0) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ── Handlers ──
  const toggleElective = useCallback((sub: string) => {
    setSelectedElectives((prev) => {
      if (prev.includes(sub)) return prev.filter((s) => s !== sub);
      if (prev.length >= 3) { toast.error("Pick exactly 3 electives."); return prev; }
      return [...prev, sub];
    });
  }, []);

  const handleSaveOnboarding = async () => {
    if (selectedElectives.length !== 3) { toast.error("Please select exactly 3 electives."); return; }
    setIsSavingOnboard(true);
    const combos = ["english", ...selectedElectives];
    const res = await saveCbtSubjects(combos);
    setIsSavingOnboard(false);
    if (res.success) {
      setProfileCombos(combos);
      setConfigSubjects(combos);
      toast.success("JAMB subjects saved!");
      setMode("config");
    } else {
      toast.error(res.error);
    }
  };

  const toggleConfigSubject = useCallback((sub: string) => {
    setConfigSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  }, []);

  const startExam = async () => {
    if (configSubjects.length === 0) { toast.error("Select at least 1 subject."); return; }
    setMode("loading");
    try {
      const res = await fetch(`/api/aspirant/cbt?subjects=${encodeURIComponent(configSubjects.join(","))}&limit=${configLimit}`);
      const data = await res.json();
      if (data.success && data.questions.length > 0) {
        setQuestions(data.questions);
        setTimeLeft(configTime);
        setCurrentIdx(0);
        setAnswers({});
        setIsSubmitted(false);
        setMode("exam");
      } else {
        toast.error("No questions available for the selected subjects.");
        setMode("config");
      }
    } catch {
      toast.error("Network error — please try again.");
      setMode("config");
    }
  };

  const handleSelectOption = useCallback((optIdx: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questions[currentIdx].id]: optIdx }));
  }, [isSubmitted, questions, currentIdx]);

  const handleSubmit = async () => {
    setIsSyncing(true);
    const score = questions.reduce(
      (acc, q) => acc + (answers[q.id] !== undefined && q.options[answers[q.id]]?.isCorrect ? 1 : 0),
      0
    );
    try {
      await fetch("/api/aspirant/cbt", {
        method: "POST",
        body: JSON.stringify({ score, totalQuestions: questions.length }),
      });
      setIsSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      toast.error("Failed to submit — your progress is saved locally.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    localStorage.removeItem(STORAGE_KEY);
    setMode("config");
  };

  // ── Render ──
  if (mode === "loading") return <PageLoader label="Loading CBT Engine…" />;

  if (mode === "onboarding")
    return (
      <OnboardingScreen
        selectedElectives={selectedElectives}
        onToggle={toggleElective}
        onSave={handleSaveOnboarding}
        isSaving={isSavingOnboard}
      />
    );

  if (mode === "config")
    return (
      <ConfigScreen
        profileCombos={profileCombos}
        configSubjects={configSubjects}
        onToggle={toggleConfigSubject}
        configTime={configTime}
        onTimeChange={setConfigTime}
        configLimit={configLimit}
        onLimitChange={setConfigLimit}
        onStart={startExam}
        onEditSubjects={() => setMode("onboarding")}
      />
    );

  if (isSubmitted)
    return (
      <ResultsScreen
        questions={questions}
        answers={answers}
        onRetry={handleRetry}
        onDashboard={() => router.push("/dashboard")}
      />
    );

  return (
    <ExamScreen
      questions={questions}
      currentIdx={currentIdx}
      answers={answers}
      timeLeft={timeLeft}
      isSyncing={isSyncing}
      onSelectOption={handleSelectOption}
      onPrev={() => setCurrentIdx((i) => Math.max(0, i - 1))}
      onNext={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
      onJump={setCurrentIdx}
      onSubmit={handleSubmit}
    />
  );
}
