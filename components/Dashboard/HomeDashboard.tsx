import React from "react";
import { useDashboard } from "@/hooks/useDashboard";
import KPICards from "./Analytics/KPICards";
import ActivityHeatmap from "./Analytics/ActivityHeatmap";
import GoalsCard from "./Analytics/GoalsCard";
import AIInsights from "./Analytics/AIInsights";
import ContinueReading from "./Analytics/ContinueReading";
import { useAnalytics } from "@/hooks/useAnalytics";
import Charts from "./Charts";
import { CourseRegistrationModal } from "@/components/Dashboard/CourseRegistration";
import HomeDashboardSkeleton from "@/components/Dashboard/HomeDashboardSkeleton";
import { ExamPrepBanner } from "@/components/Dashboard/ExamPrepBanner";
import AddedMaterials from "./AddedMaterials";
import StudyCarousel from "./StudyCarousel";
import QuickActions from "./QuickActions";
import StreakTracker from "./StreakTracker";
import { useUser } from "@clerk/nextjs";

const HomeDashboard = () => {
  const { user } = useUser();
  const { data, isLoading: booksLoading } = useDashboard();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();

  if (booksLoading || analyticsLoading) {
    return <HomeDashboardSkeleton />;
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-2 space-y-10 premium-bg min-h-screen font-poppins">
      <CourseRegistrationModal departmentId={data?.user?.departmentId} />

      {/* 0. Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Hello, {user?.firstName || "Student"}! 👋
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Ready to continue your learning journey today?
          </p>
        </div>
        <div className="hidden lg:block">
          <QuickActions />
        </div>
      </div>

      {/* 1. Top Section: Carousel & (Streak + Goals) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8">
          <StudyCarousel />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1">
            <StreakTracker />
          </div>
          <div className="flex-1">
            <div className="glass-card rounded-[2.5rem] shadow-sm hover:shadow-md transition-all h-full">
              <GoalsCard />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions (Mobile/Tablet visible only if needed) */}
      <div className="lg:hidden">
        <QuickActions />
      </div>

      {/* 3. Key Performance Indicators */}
      <KPICards
        booksRead={analyticsData?.kpis?.booksRead || 0}
        minutesRead={analyticsData?.kpis?.minutesRead || 0}
        streak={analyticsData?.kpis?.streak || 0}
        daysToExam={analyticsData?.kpis?.daysToExam}
        totalAiRequests={analyticsData?.kpis?.totalAiRequests}
        loading={analyticsLoading}
      />

      {/* 4. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Column (Trends & Activity) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Weekly Trends Chart */}
          <div className="glass-card rounded-[2.5rem] w-full p-6 h-[450px] relative overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                Learning Activity
              </h3>
              <div className="flex gap-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Last 7 Days</span>
              </div>
            </div>
            <Charts />
          </div>

          {/* Recent Activity Heatmap */}
          <div className="glass-card p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
            <ActivityHeatmap data={analyticsData?.heatmap || []} loading={analyticsLoading} />
          </div>
        </div>

        {/* Right Column (Exam Prep, AI, Continue Reading) */}
        <div className="lg:col-span-4 space-y-10">
          {/* Exam Prep Banner */}
          <div className="w-full">
            <ExamPrepBanner courses={data?.enrolledCourses || []} />
            {(!data?.enrolledCourses || data.enrolledCourses.length === 0) && (
              <div className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-center border-emerald-100 dark:border-emerald-900/30">
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Steady Progress</h3>
                <p className="text-sm text-zinc-500">You're doing great! Keep exploring materials to stay ahead of your courses.</p>
              </div>
            )}
          </div>

          {/* AI Stacked */}
          <div className="glass-card rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
            <AIInsights />
          </div>

          {/* Continue Reading / Recently Viewed */}
          <div className="glass-card rounded-t-3xl rounded-b-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
            <ContinueReading />
          </div>
        </div>
      </div>



      {/* 5. Browse / Suggestions Section */}
      <div className="pt-4">
        <AddedMaterials books={data?.books || []} loading={booksLoading} />
      </div>
    </div>
  );
};

export default HomeDashboard;

