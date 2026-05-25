"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Bell, Sparkles } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function MobileHeader() {
  const { user, isLoaded } = useUser();
  const { data: analytics } = useAnalytics();
  const streak = analytics?.kpis?.streak || 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        {/* Avatar + greeting */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600">
            {isLoaded && user?.imageUrl ? (
              <Image src={user.imageUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black font-cabin text-base">
                {user?.firstName?.charAt(0) ?? "S"}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 font-poppins">{greeting}</p>
            <p className="text-sm font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              {isLoaded ? (user?.firstName ?? "Student") : "…"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <span className="text-base leading-none">🔥</span>
              <span className="text-[11px] font-black font-cabin">{streak}</span>
            </div>
          )}
          <Link
            href="/dashboard/ai"
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-3.5 py-2 rounded-xl text-[10px] font-black font-cabin uppercase tracking-widest transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI
          </Link>
          <button className="relative w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-zinc-900" />
          </button>
        </div>
      </div>

      {/* Contextual sub-line */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[11px] font-poppins text-zinc-500 dark:text-zinc-400">
          {streak > 0
            ? `You're on a ${streak}-day streak — don't break it!`
            : "Start reading today to build your streak."}
        </p>
      </div>
    </div>
  );
}
