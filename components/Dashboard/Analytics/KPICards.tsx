import React from "react";
import { BookOpen, Clock, Flame, CalendarDays, Sparkles } from "lucide-react";
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Books Read"
        value={booksRead}
        icon={BookOpen}
        description="Total books finished"
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
        title="AI Assistance"
        value={totalAiRequests || 0}
        icon={Sparkles}
        description="Total AI interventions"
        className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10"
        loading={loading}
      />
       <StatCard
        title="Days to Exam"
        value={daysToExam ?? "--"}
        icon={CalendarDays}
        description="Until closest final"
        className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10"
        loading={loading}
      />
    </div>
  );
};

export default KPICards;
