"use client";

import React, { useState } from "react";
import {
  Trophy,
  Crown,
  Flame,
  Loader2,
  Globe,
  Users,
  BookOpen,
  ClipboardCheck,
  Star,
  TrendingUp,
  Medal,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useUserData } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────── */
interface LeaderUser {
  id: string;
  name: string;
  department: string;
  points: number;
  streak: number;
  avatar?: string;
}

/* ─── Medal colour palette ───────────────────────────────── */
const MEDAL = [
  {
    ring: "ring-amber-400",
    bg: "from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20",
    bar: "bg-gradient-to-t from-amber-300 to-amber-200 dark:from-amber-800/60 dark:to-amber-700/30",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-400 text-amber-900",
    glow: "shadow-[0_0_28px_rgba(251,191,36,0.35)]",
    height: "h-40",
    size: "w-24 h-24",
    icon: Crown,
    label: "1st",
  },
  {
    ring: "ring-zinc-400",
    bg: "from-zinc-50 to-zinc-100 dark:from-zinc-900/40 dark:to-zinc-800/20",
    bar: "bg-gradient-to-t from-zinc-300 to-zinc-200 dark:from-zinc-700/50 dark:to-zinc-600/30",
    text: "text-zinc-500 dark:text-zinc-400",
    badge: "bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200",
    glow: "",
    height: "h-28",
    size: "w-20 h-20",
    icon: Medal,
    label: "2nd",
  },
  {
    ring: "ring-orange-300",
    bg: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
    bar: "bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/20",
    text: "text-orange-500 dark:text-orange-400",
    badge: "bg-orange-300 dark:bg-orange-700 text-orange-900 dark:text-orange-200",
    glow: "",
    height: "h-20",
    size: "w-16 h-16",
    icon: Medal,
    label: "3rd",
  },
];

/* ─── How points are earned info bar ─────────────────────── */
function HowPointsWork() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 mt-1">
      {[
        { icon: BookOpen, label: "Pages read × 2 pts" },
        { icon: ClipboardCheck, label: "CBT score pts" },
        { icon: Flame, label: "Daily streak bonus" },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] font-poppins font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Podium card ─────────────────────────────────────────── */
function PodiumCard({ user, rank, isCurrentUser }: { user: LeaderUser; rank: number; isCurrentUser: boolean }) {
  const m = MEDAL[rank];
  const Icon = m.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, type: "spring", stiffness: 300, damping: 28 }}
      className="flex flex-col items-center gap-2 w-full sm:w-auto"
    >
      {/* Avatar + badge */}
      <div className="relative">
        {rank === 0 && (
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 z-10"
          >
            <Crown className="w-7 h-7 text-amber-400 fill-amber-300 drop-shadow-lg" />
          </motion.div>
        )}
        <Avatar className={cn("border-4 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950", m.ring, m.size, m.glow)}>
          <AvatarImage src={user.avatar} />
          <AvatarFallback className={cn("font-black font-cabin text-lg bg-gradient-to-br", m.bg)}>
            {user.name?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>
        <span className={cn("absolute -bottom-2 -right-2 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center border-2 border-white dark:border-zinc-950 shadow-sm", m.badge)}>
          {rank + 1}
        </span>
        {isCurrentUser && (
          <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-950 flex items-center justify-center shadow">
            <Star className="w-3 h-3 text-white fill-white" />
          </span>
        )}
      </div>

      {/* Name + points */}
      <div className="text-center">
        <p className={cn("font-black font-cabin truncate tracking-tight", rank === 0 ? "text-base w-32" : "text-sm w-24")}>
          {user.name.split(" ")[0]}
        </p>
        <p className={cn("text-xs font-bold font-poppins", m.text)}>{Math.round(user.points).toLocaleString()} pts</p>
        {user.streak > 0 && (
          <p className="text-[10px] text-orange-500 font-medium flex items-center justify-center gap-0.5 mt-0.5">
            <Flame className="w-3 h-3" />{user.streak}d
          </p>
        )}
      </div>

      {/* Podium bar */}
      <div className={cn("w-full sm:w-28 rounded-t-2xl border-t border-x flex flex-col items-center justify-end pb-3", m.bar, m.height)}>
        <Icon className={cn("w-7 h-7 opacity-60", m.text)} />
      </div>
    </motion.div>
  );
}

/* ─── Rank row ────────────────────────────────────────────── */
function RankRow({ user, rank, isCurrentUser }: { user: LeaderUser; rank: number; isCurrentUser: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={cn(
        "flex items-center gap-4 px-5 py-3.5 transition-colors group",
        isCurrentUser
          ? "bg-blue-50/80 dark:bg-blue-950/30"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      )}
    >
      {/* rank number */}
      <div className="w-8 text-center">
        <span className={cn("text-sm font-black font-cabin", isCurrentUser ? "text-blue-600 dark:text-blue-400" : "text-zinc-400")}>
          {rank + 4}
        </span>
      </div>

      {/* avatar */}
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800">
          {user.name?.[0]}
        </AvatarFallback>
      </Avatar>

      {/* name + dept */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm font-poppins text-zinc-900 dark:text-zinc-50 truncate">
            {user.name}
          </p>
          {isCurrentUser && (
            <span className="text-[9px] font-black font-cabin text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">You</span>
          )}
        </div>
        <p className="text-[11px] text-zinc-400 font-poppins truncate">{user.department}</p>
      </div>

      {/* streak */}
      {user.streak > 0 && (
        <div className="hidden sm:flex items-center gap-1 text-orange-500 shrink-0">
          <Flame className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{user.streak}d</span>
        </div>
      )}

      {/* points bar + number */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:block w-20">
          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (user.points / 500) * 100)}%` }}
              transition={{ delay: rank * 0.04 + 0.3, duration: 0.6 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            />
          </div>
        </div>
        <span className="text-sm font-black font-cabin text-indigo-600 dark:text-indigo-400 min-w-[4rem] text-right">
          {Math.round(user.points).toLocaleString()} pts
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function LeaderboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-center gap-6 items-end pb-8 pt-4">
        {[2, 1, 3].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className={cn("rounded-full bg-zinc-200 dark:bg-zinc-800", i === 1 ? "w-24 h-24" : "w-16 h-16")} />
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className={cn("w-28 rounded-t-2xl bg-zinc-200 dark:bg-zinc-800", i === 1 ? "h-40" : i === 0 ? "h-28" : "h-20")} />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <div className="w-8 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-2 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function LeaderboardPage() {
  const [filterMode, setFilterMode] = useState<"department" | "global">("department");
  const { data: userData } = useUserData();

  const { data: topUsers, isLoading } = useQuery<LeaderUser[]>({
    queryKey: ["leaderboard", filterMode],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?filter=${filterMode}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  const myRank = topUsers?.findIndex((u) => u.id === userData?.id) ?? -1;
  const myUser = myRank >= 0 ? topUsers![myRank] : null;

  const topThree = topUsers?.slice(0, 3) ?? [];
  const rest = topUsers?.slice(3) ?? [];

  // Reorder podium: 2nd | 1st | 3rd for visual effect
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
  const podiumRankMap: Record<string, number> = {};
  if (topThree[0]) podiumRankMap[topThree[0].id] = 0;
  if (topThree[1]) podiumRankMap[topThree[1].id] = 1;
  if (topThree[2]) podiumRankMap[topThree[2].id] = 2;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins pb-24">
      {/* ── Hero Header ──────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950 dark:from-zinc-950 dark:to-indigo-950 px-6 py-10 md:px-10 md:py-14">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-4 right-8 w-64 h-64 rounded-full border-[40px] border-amber-400" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full border-[32px] border-indigo-400" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-amber-400/20 backdrop-blur">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[10px] font-black font-cabin uppercase tracking-[0.25em] text-zinc-400">Rankings</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black font-cabin tracking-tighter text-white leading-none">
                {filterMode === "department" ? "Dept" : "Global"}{" "}
                <span className="text-amber-400">Leaderboard</span>
              </h1>
              <p className="text-zinc-400 text-sm mt-2 font-light max-w-md">
                Earn points by reading materials, completing CBT exams, and maintaining daily streaks.
              </p>
              <HowPointsWork />
            </div>

            {/* Filter toggle */}
            <div className="flex items-center gap-2 p-1 bg-white/10 backdrop-blur rounded-2xl border border-white/10 self-start md:self-auto shrink-0">
              {[
                { key: "department", icon: Users, label: "My Dept" },
                { key: "global", icon: Globe, label: "Global" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterMode(key as any)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black font-cabin uppercase tracking-widest transition-all duration-200",
                    filterMode === key
                      ? "bg-white text-zinc-900 shadow-lg"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Your rank card */}
          {myUser && myRank >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur flex items-center gap-4"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent">
                    <AvatarImage src={userData?.imageUrl ?? ""} />
                    <AvatarFallback className="bg-blue-600 text-white font-black text-sm">
                      {myUser.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Star className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-blue-300 fill-blue-300" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm font-cabin">Your Position</p>
                  <p className="text-zinc-400 text-[11px]">{myUser.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center hidden sm:block">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-cabin">Rank</p>
                  <p className="text-2xl font-black font-cabin text-white">#{myRank + 1}</p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-cabin">Points</p>
                  <p className="text-2xl font-black font-cabin text-indigo-300">{Math.round(myUser.points).toLocaleString()}</p>
                </div>
                {myUser.streak > 0 && (
                  <div className="text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-cabin">Streak</p>
                    <p className="text-2xl font-black font-cabin text-orange-400 flex items-center gap-0.5">
                      <Flame className="w-5 h-5" />{myUser.streak}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeleton" exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <LeaderboardSkeleton />
              </div>
            </motion.div>
          ) : !topUsers || topUsers.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-black font-cabin text-zinc-900 dark:text-zinc-50">No Rankings Yet</h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Start reading and taking CBT exams to appear on the leaderboard!
              </p>
            </motion.div>
          ) : (
            <motion.div key={filterMode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                {/* ── Podium ── */}
                {topThree.length > 0 && (
                  <div className="px-6 pt-10 pb-0 bg-gradient-to-b from-zinc-50/60 to-white dark:from-zinc-800/20 dark:to-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-end justify-center gap-4 md:gap-8">
                      {podiumOrder.map((user) => {
                        const rank = podiumRankMap[user.id];
                        return (
                          <PodiumCard
                            key={user.id}
                            user={user}
                            rank={rank}
                            isCurrentUser={user.id === userData?.id}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Rank list header ── */}
                {rest.length > 0 && (
                  <>
                    <div className="px-5 py-3 bg-zinc-50/60 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-cabin">
                        Rankings · Positions 4–{topUsers.length}
                      </h3>
                      <div className="flex items-center gap-1 text-zinc-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-poppins">{topUsers.length} students</span>
                      </div>
                    </div>

                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      {rest.map((user, idx) => (
                        <RankRow
                          key={user.id}
                          user={user}
                          rank={idx}
                          isCurrentUser={user.id === userData?.id}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="px-5 py-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <p className="text-[10px] text-zinc-400 font-poppins">
                    Points update in real-time as you read and complete exams.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
