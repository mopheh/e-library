import React from "react";
import { BookOpen, Flame, CalendarDays, Sparkles, Brain } from "lucide-react";
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
  loading 
}: KPICardsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Books Read"
        value={booksRead}
        icon={BookOpen}
        iconClassName="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
        loading={loading}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Study Streak"
        value={`${streak} Days`}
        icon={Flame}
        iconClassName="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
        loading={loading}
        trend={{ value: 5, isPositive: true }}
      />
      <StatCard
        title="AI Interventions"
        value={totalAiRequests || 0}
        icon={Brain}
        iconClassName="text-violet-600 bg-violet-50 dark:bg-violet-900/20"
        loading={loading}
      />
       <StatCard
        title="Days to Exam"
        value={daysToExam ?? "--"}
        icon={CalendarDays}
        iconClassName="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
        loading={loading}
      />
    </div>
  );
};

export default KPICards;

