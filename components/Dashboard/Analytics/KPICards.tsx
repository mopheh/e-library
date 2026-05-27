import React from "react";
import { BookOpen, Flame, CalendarDays, Brain } from "lucide-react";
import { StatCard } from "./StatCard";

interface KPICardsProps {
  booksRead: number;
  minutesRead: number;
  streak: number;
  daysToExam?: number | null;
  totalAiRequests?: number;
  loading?: boolean;
}

const KPICards = ({
  booksRead,
  minutesRead,
  streak,
  daysToExam,
  totalAiRequests,
  loading,
}: KPICardsProps) => {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Books Read"
        value={booksRead}
        icon={BookOpen}
        iconClassName="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        accentColor="bg-blue-600"
        loading={loading}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Study Streak"
        value={`${streak}d`}
        icon={Flame}
        iconClassName="bg-amber-100 dark:bg-amber-900/30 text-amber-500"
        accentColor="bg-amber-500"
        loading={loading}
        trend={{ value: 5, isPositive: true }}
      />
      <StatCard
        title="AI Sessions"
        value={totalAiRequests ?? 0}
        icon={Brain}
        iconClassName="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
        accentColor="bg-violet-600"
        loading={loading}
      />
      <StatCard
        title="Days to Exam"
        value={daysToExam ?? "--"}
        icon={CalendarDays}
        iconClassName="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        accentColor="bg-emerald-600"
        loading={loading}
      />
    </div>
  );
};

export default KPICards;
