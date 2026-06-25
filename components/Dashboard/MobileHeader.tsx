"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Bell, Sparkles, Search } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";

export default function MobileHeader() {
  const { user, isLoaded } = useUser();
  const { data: analytics } = useAnalytics();
  const streak = analytics?.kpis?.streak || 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName = isLoaded ? (user?.firstName ?? "Student") : null;

  return (
    <div className="px-5 pt-safe-or-6 pb-4 space-y-4"
         style={{ paddingTop: "max(24px, env(safe-area-inset-top))" }}>

      {/* ── Top bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">

        {/* Avatar + greeting */}
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
                {firstName?.charAt(0) ?? "S"}
              </div>
            )}
          </motion.div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-poppins uppercase tracking-widest leading-none mb-0.5">
              {greeting}
            </p>
            <p className="text-[17px] font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight truncate">
              {firstName ?? (
                <span className="inline-block w-24 h-4 bg-zinc-100 dark:bg-zinc-800 rounded-md animate-pulse" />
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
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

          <button className="relative w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:scale-95">
            <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse" />
          </button>
        </div>
      </div>

      {/* ── Search hint bar ─────────────────────────── */}
      <Link href="/library" className="block">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors active:scale-[0.98]">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="text-sm text-zinc-400 dark:text-zinc-500 font-poppins select-none">
            Search books, materials...
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
