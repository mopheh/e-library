"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { LeaderboardTable } from "@/components/Dashboard/LeaderboardTable";
import { useDashboard } from "@/hooks/useDashboard";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  // Trigger Next.js recompile to fix development 404
  const { data, isLoading } = useDashboard();
  
  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-background min-h-screen max-w-7xl mx-auto">
      <div className="space-y-3 mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold font-cabin flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Department Leaderboard
        </h1>
        <p className="text-muted-foreground text-sm font-poppins">
          Earn points by reading materials, generating quizzes, offering help in study rooms, and publishing survival guides. Rank up to become the top scholar in your department.
        </p>
      </div>

      <div className="mt-8">
         {/* the data.user.departmentId provides the context to fetch points */}
         {data?.user?.departmentId ? (
            <LeaderboardTable departmentId={data.user.departmentId} />
         ) : isLoading ? (
            <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-2xl"></div>
         ) : (
            <div className="p-8 text-xs font-poppins text-center text-muted-foreground border border-dashed rounded-xl">
               Please complete your academic profile to see your department's leaderboard.
            </div>
         )}
      </div>
    </div>
  );
}
