"use client";

import React, { useState } from "react";
import { Trophy, Medal, Crown, Flame, Loader2, Globe, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  const [filterMode, setFilterMode] = useState<"department" | "global">("department");

  const { data: topUsers, isLoading } = useQuery({
    queryKey: ["leaderboard", filterMode],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?filter=${filterMode}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-zinc-500 font-poppins text-sm">Calculating rankings...</p>
      </div>
    );
  }

  const winners = topUsers?.slice(0, 3) || [];
  const others = topUsers?.slice(3) || [];
  return (
    <div className="p-4 md:p-8 space-y-8 font-poppins bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-open-sans flex items-center gap-3">
             <Trophy className="text-amber-500 w-8 h-8" /> {filterMode === "department" ? "Department Benchmark" : "Global Leaderboard"}
          </h1>
          <p className="text-zinc-500 mt-2">
            Compete with your peers by taking CBT mock exams and reading materials.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Scope Toggle */}
          <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/50 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode("department")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterMode === "department" 
                  ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Users className="w-4 h-4" /> My Dept
            </button>
            <button
              onClick={() => setFilterMode("global")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterMode === "global" 
                  ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400" 
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Globe className="w-4 h-4" /> Global
            </button>
          </div>

          {/* Exam Mode Toggle (Visual Only) */}
          <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 p-2 rounded-xl flex items-center gap-3 shadow-sm hidden sm:flex">
             <div className="w-10 h-10 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg flex items-center justify-center">
               <Flame className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Exam Mode</p>
                <div className="flex items-center gap-2 mt-1">
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" value="" className="sr-only peer" />
                     <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-red-600"></div>
                   </label>
                   <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Off</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
         {/* Top 3 Podium */}
         <div className="lg:col-span-3 flex flex-col sm:flex-row items-end justify-center gap-4 md:gap-8 pb-8">
            {/* 2nd Place */}
            {winners[1] && (
              <div className="flex flex-col items-center order-2 sm:order-1 w-full sm:w-auto">
                 <div className="relative mb-2">
                   <Avatar className="w-16 h-16 border-4 border-zinc-200 dark:border-zinc-800 shadow-md">
                      <AvatarImage src={winners[1].avatar} />
                      <AvatarFallback>{winners[1].name[0]}</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 -right-2 bg-zinc-200 dark:bg-zinc-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white dark:border-zinc-950">2</div>
                 </div>
                 <div className="text-center mb-4">
                    <p className="font-bold text-sm truncate w-24">{winners[1].name}</p>
                    <p className="text-xs text-zinc-500 font-medium">{Math.round(winners[1].points)} pts</p>
                 </div>
                 <div className="w-full sm:w-28 h-32 bg-gradient-to-t from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-t-2xl border-t border-x border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-end pb-4">
                    <Medal className="w-8 h-8 text-zinc-400 mb-2 opacity-50" />
                 </div>
              </div>
            )}

            {/* 1st Place */}
            {winners[0] && (
              <div className="flex flex-col items-center order-1 sm:order-2 w-full sm:w-auto z-10">
                 <div className="relative mb-2">
                   <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-500 z-10" />
                   <Avatar className="w-24 h-24 border-4 border-amber-400 shadow-lg relative z-0">
                      <AvatarImage src={winners[0].avatar} />
                      <AvatarFallback className="text-xl">{winners[0].name[0]}</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white dark:border-zinc-950 z-10">1</div>
                 </div>
                 <div className="text-center mb-4">
                    <p className="font-bold text-base truncate w-32">{winners[0].name}</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-bold">{Math.round(winners[0].points)} pts</p>
                 </div>
                 <div className="w-full sm:w-32 h-40 bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/20 rounded-t-2xl border-t border-x border-amber-300 dark:border-amber-700/50 flex flex-col items-center justify-end pb-4 shadow-[0_-10px_20px_-5px_rgba(251,191,36,0.3)]">
                   <Medal className="w-10 h-10 text-amber-500 mb-2 opacity-80" />
                 </div>
              </div>
            )}

            {/* 3rd Place */}
            {winners[2] && (
              <div className="flex flex-col items-center order-3 w-full sm:w-auto">
                 <div className="relative mb-2">
                   <Avatar className="w-16 h-16 border-4 border-orange-200 dark:border-orange-900/50 shadow-md">
                      <AvatarImage src={winners[2].avatar} />
                      <AvatarFallback>{winners[2].name[0]}</AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-2 -right-2 bg-orange-200 dark:bg-orange-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white dark:border-zinc-950 text-orange-900 dark:text-orange-200">3</div>
                 </div>
                 <div className="text-center mb-4">
                    <p className="font-bold text-sm truncate w-24">{winners[2].name}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{Math.round(winners[2].points)} pts</p>
                 </div>
                 <div className="w-full sm:w-28 h-28 bg-gradient-to-t from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/20 rounded-t-2xl border-t border-x border-orange-200 dark:border-orange-800/50 flex flex-col items-center justify-end pb-4">
                   <Medal className="w-8 h-8 text-orange-400/80 mb-2 opacity-50" />
                 </div>
              </div>
            )}
         </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
         <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold">Overall Rankings</h3>
         </div>
         <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {others.map((u: any, idx: number) => (
               <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="w-8 flex justify-center font-bold text-zinc-400">
                     {idx + 4}
                  </div>
                  <Avatar className="w-10 h-10">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                     <p className="font-bold text-sm">{u.name}</p>
                     <p className="text-xs text-zinc-500">{u.department}</p>
                  </div>
                  <div className="flex items-center gap-2 mr-4">
                     <Flame className="w-4 h-4 text-orange-500" />
                     <span className="text-sm font-bold text-orange-500">{u.streak} Days</span>
                  </div>
                  <div className="text-right">
                     <p className="font-bold text-indigo-600 dark:text-indigo-400">{Math.round(u.points)} pts</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
