import React from "react";
import { BookOpen, Clock, Flame, CalendarDays } from "lucide-react";
import { StatCard } from "./StatCard";

interface KPICardsProps {
  booksRead: number;
  minutesRead: number;
  streak: number;
  loading?: boolean;
}

const KPICards = ({ booksRead, minutesRead, streak, loading }: KPICardsProps) => {
  // Calculate Days to Exam (Mock logic or passed prop?)
  // For now, let's keep the logic consistent with UserStats but clean
  const today = new Date();
  const examDate = new Date(2025, 9, 14); // Oct 14, 2025? (Month is 0-indexed in JS Date? 9=Oct)
  // Logic from UserStats: const examDate = new Date(2026, 2, 16); 
  // Let's stick to a consistent date. UserStats had 2026-03-16.
  // We'll use a standard calculation here.
  const targetDate = new Date(2026, 2, 16); 
  const diffTime = Math.abs(targetDate.getTime() - today.getTime());
  const daysToExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Books Read"
        value={booksRead}
        icon={BookOpen}
        description="Total books finished"
        loading={loading}
      />
      <StatCard
        title="Minutes Read"
        value={minutesRead}
        icon={Clock}
        description="Total time spent reading"
        loading={loading}
      />
      <StatCard
        title="Current Streak"
        value={`${streak} Days`}
        icon={Flame}
        description="Consecutive days reading"
        className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-900/10"
        loading={loading}
      />
       <StatCard
        title="Days to Exam"
        value={daysToExam}
        icon={CalendarDays}
        description="Until Final Exams"
        className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10"
        loading={loading}
      />
    </div>
  );
};

export default KPICards;
