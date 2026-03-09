"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Medal, Trophy, TrendingUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";

interface LeaderboardEntry {
  id: string;
  fullName: string;
  level: string;
  points: number;
}

export const LeaderboardTable = ({ departmentId }: { departmentId: string }) => {
  const { user } = useUser();

  // const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
  //   queryKey: ["departmentLeaderboard", departmentId],
  //   queryFn: async () => {
  //     const res = await fetch(`/api/departments/${departmentId}/leaderboard`);
  //     if (!res.ok) throw new Error("Failed to load leaderboard");
  //     return res.json();
  //   },
  //   enabled: !!departmentId,
  // });

  const isLoading = false;
  const leaderboard: LeaderboardEntry[] = [
    { id: "1", fullName: "Alice Johnson", level: "400", points: 15420 },
    { id: "2", fullName: "Bob Smith", level: "300", points: 12350 },
    { id: "3", fullName: "Charlie Brown", level: "500", points: 10200 },
    { id: "4", fullName: "Diana Prince", level: "200", points: 8500 },
    { id: "5", fullName: "Evan Wright", level: "400", points: 7200 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center p-16 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-950 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="bg-white dark:bg-zinc-900 w-20 h-20 flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
          <Trophy className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2 font-open-sans">No Activity Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto font-poppins">
          No students in this department have accumulated points yet. Be the first to start reading and engaging!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-8">
        {/* Top 3 podium */}
        {leaderboard.length >= 2 && (
          <div className="flex flex-col items-center justify-end h-full order-2 md:order-1 pt-8">
             <Avatar className="w-16 h-16 border-4 border-slate-300 shadow-md">
               <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-xl">{leaderboard[1].fullName[0]}</AvatarFallback>
             </Avatar>
             <div className="mt-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-xl w-full text-center p-4 min-h-[120px] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400"></div>
               <Medal className="w-6 h-6 text-slate-400 mx-auto mb-2" />
               <h4 className="font-poppins font-bold text-sm truncate">{leaderboard[1].fullName}</h4>
               <p className="text-xs text-muted-foreground">{leaderboard[1].level} Lvl</p>
               <div className="mt-2 font-bold text-slate-600 dark:text-slate-400 font-poppins">{leaderboard[1].points.toLocaleString()} pts</div>
             </div>
          </div>
        )}
        
        {leaderboard.length >= 1 && (
          <div className="flex flex-col items-center justify-end h-full order-1 md:order-2 z-10">
             <div className="relative">
               <div className="absolute -top-6 -left-2 transform -rotate-12">
                 <Trophy className="w-8 h-8 text-amber-400 drop-shadow-md" fill="currentColor" />
               </div>
               <Avatar className="w-20 h-20 border-4 border-amber-300 shadow-lg ring-4 ring-amber-50 dark:ring-amber-900/20">
                 <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-2xl">{leaderboard[0].fullName[0]}</AvatarFallback>
               </Avatar>
             </div>
             <div className="mt-4 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900 border border-amber-200 dark:border-amber-800/50 rounded-t-xl w-full text-center p-4 min-h-[140px] shadow-md relative overflow-hidden transform scale-105">
               <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500"></div>
               <h4 className="font-poppins font-bold text-base truncate mt-2 text-amber-950 dark:text-amber-100">{leaderboard[0].fullName}</h4>
               <p className="text-xs text-amber-700/70 dark:text-amber-200/50 font-medium">{leaderboard[0].level} Lvl</p>
               <div className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-500 font-poppins drop-shadow-sm">{leaderboard[0].points.toLocaleString()} pts</div>
             </div>
          </div>
        )}

        {leaderboard.length >= 3 && (
          <div className="flex flex-col items-center justify-end h-full order-3 pt-12">
             <Avatar className="w-14 h-14 border-4 border-emerald-700/30 shadow-sm">
               <AvatarFallback className="bg-emerald-50 text-emerald-800 font-bold text-lg">{leaderboard[2].fullName[0]}</AvatarFallback>
             </Avatar>
             <div className="mt-4 bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-zinc-800 rounded-t-xl w-full text-center p-4 min-h-[100px] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600/50"></div>
               <Medal className="w-5 h-5 text-emerald-600/70 mx-auto mb-2" />
               <h4 className="font-poppins font-bold text-sm truncate">{leaderboard[2].fullName}</h4>
               <p className="text-xs text-muted-foreground">{leaderboard[2].level} Lvl</p>
               <div className="mt-2 font-bold text-emerald-700/80 dark:text-emerald-500 font-poppins">{leaderboard[2].points.toLocaleString()} pts</div>
             </div>
          </div>
        )}
      </div>

      <Card className="border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
           {leaderboard.map((entry, index) => {
              const isCurrentUser = user?.fullName === entry.fullName; // Cheap check for UX feel
              return (
                <div 
                  key={entry.id} 
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors ${
                    isCurrentUser ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  <div className="w-8 flex justify-center items-center">
                    {index === 0 ? <Medal className="w-5 h-5 text-amber-500" /> :
                     index === 1 ? <Medal className="w-5 h-5 text-slate-400" /> :
                     index === 2 ? <Medal className="w-5 h-5 text-emerald-600/70" /> :
                     <span className="text-sm font-bold text-muted-foreground font-poppins">{index + 1}</span>}
                  </div>
                  <Avatar className="w-10 h-10 border border-gray-100 dark:border-zinc-800">
                    <AvatarFallback className={`text-xs font-bold ${
                      isCurrentUser ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
                    }`}>
                      {entry.fullName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                       {entry.fullName}
                       {isCurrentUser && <Star className="w-3.5 h-3.5 text-blue-500 drop-shadow-sm" fill="currentColor"/>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{entry.level} Lvl Student</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-base font-bold font-poppins text-foreground">{entry.points.toLocaleString()}</span>
                  </div>
                </div>
              );
           })}
        </div>
      </Card>
    </div>
  );
};
