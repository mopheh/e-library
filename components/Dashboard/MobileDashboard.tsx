"use client";

import React from "react";
import MobileHeader from "./MobileHeader";
import MobileStudyCarousel from "./MobileStudyCarousel";
import MobileReadingChart from "./MobileReadingChart";
import QuickActions from "./QuickActions";
import StreakTracker from "./StreakTracker";
import ContinueReading from "./Analytics/ContinueReading";
import { useAnalytics } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { BookOpen, Clock, Flame, Brain } from "lucide-react";

// ── Mini KPI strip for mobile ──────────────────────────────────
function MobileKPIStrip() {
  const { data: analytics, isLoading } = useAnalytics();
  const kpis = analytics?.kpis;

  const stats = [
    {
      icon: BookOpen,
      value: kpis?.booksRead ?? 0,
      label: "Books",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: Clock,
      value: kpis?.minutesRead ? `${Math.round(kpis.minutesRead / 60)}h` : "0h",
      label: "Study",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      icon: Flame,
      value: `${kpis?.streak ?? 0}d`,
      label: "Streak",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: Brain,
      value: kpis?.totalAiRequests ?? 0,
      label: "AI",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
  ];

  return (
    <div className="mx-5 grid grid-cols-4 gap-2.5">
      {stats.map(({ icon: Icon, value, label, color, bg }, i) => (
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
              <span className="text-[9px] font-bold font-cabin uppercase tracking-wide text-zinc-400 dark:text-zinc-500 leading-none">
                {label}
              </span>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-cabin px-5 mb-3">
      {children}
    </p>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function MobileDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins"
         style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}>

      {/* 0. Sticky header */}
      <div className="sticky top-0 z-30 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-transparent">
        <MobileHeader />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-7 pt-2">

        {/* 1. Carousel Section */}
        <section className="px-5">
          <MobileStudyCarousel />
        </section>

        {/* 2. KPI Stats */}
        <section>
          <SectionLabel>Your Stats</SectionLabel>
          <MobileKPIStrip />
        </section>

        {/* 3. Quick Actions */}
        <section className="px-5">
          <SectionLabel>Quick Access</SectionLabel>
          <QuickActions hideSectionLabel />
        </section>

        {/* 4. Reading Activity Chart */}
        <section>
          <SectionLabel>Reading Activity</SectionLabel>
          <MobileReadingChart />
        </section>

        {/* 5. Streak Tracker — DO NOT TOUCH */}
        <section className="px-5">
          <SectionLabel>Study Streak</SectionLabel>
          <StreakTracker />
        </section>

        {/* 6. Continue Reading */}
        <section>
          <SectionLabel>Resume</SectionLabel>
          <div className="mx-5 bg-white dark:bg-zinc-900 rounded-[22px] border border-zinc-100 dark:border-zinc-800/60 shadow-sm overflow-hidden">
            <ContinueReading />
          </div>
        </section>
      </div>
    </div>
  );
}
