import React from "react";
import { useUser } from "@clerk/nextjs";
import { useDashboard } from "@/hooks/useDashboard";
import { useAnalytics } from "@/hooks/useAnalytics";
import KPICards from "./Analytics/KPICards";
import ActivityHeatmap from "./Analytics/ActivityHeatmap";
import GoalsCard from "./Analytics/GoalsCard";
import AIInsights from "./Analytics/AIInsights";
import ContinueReading from "./Analytics/ContinueReading";
import Charts from "./Charts";
import { CourseRegistrationModal } from "@/components/Dashboard/CourseRegistration";
import HomeDashboardSkeleton from "@/components/Dashboard/HomeDashboardSkeleton";
import { ExamPrepBanner } from "@/components/Dashboard/ExamPrepBanner";
import AddedMaterials from "./AddedMaterials";
import StudyCarousel from "./StudyCarousel";
import QuickActions from "./QuickActions";
import StreakTracker from "./StreakTracker";
import { Sparkles, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const HomeDashboard = () => {
  const { user } = useUser();
  const { data, isLoading: booksLoading } = useDashboard();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (booksLoading || analyticsLoading) {
    return <HomeDashboardSkeleton />;
  }

  return (
    <div className="flex-1 p-5 md:p-8 pt-3 space-y-8 min-h-screen font-poppins bg-zinc-50/50 dark:bg-zinc-950">
      <CourseRegistrationModal departmentId={data?.user?.departmentId} />

      {/* ── Desktop Greeting header ─────────────────── */}
      <div className="flex items-center justify-between gap-6">
        {/* Left: greeting */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-indigo-500 to-violet-600">
            {user?.imageUrl ? (
              <Image src={user.imageUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black font-cabin text-lg">
                {user?.firstName?.charAt(0) ?? "S"}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold text-zinc-400 font-poppins uppercase tracking-widest">
              {greeting}
            </p>
            <h1 className="text-xl md:text-2xl font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 leading-tight truncate">
              {user?.firstName ?? "Student"}&apos;s Dashboard
            </h1>
          </div>
        </div>

        {/* Right: actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/ai"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black font-cabin text-[10px] uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Assistant
          </Link>
          <button className="relative w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            <Bell className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-zinc-900" />
          </button>
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────── */}
      <KPICards
        booksRead={analyticsData?.kpis?.booksRead || 0}
        minutesRead={analyticsData?.kpis?.minutesRead || 0}
        streak={analyticsData?.kpis?.streak || 0}
        daysToExam={analyticsData?.kpis?.daysToExam}
        totalAiRequests={analyticsData?.kpis?.totalAiRequests}
        loading={analyticsLoading}
      />

      {/* ── Carousel + Streak + Goals ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <StudyCarousel />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex-1">
            <StreakTracker />
          </div>
          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all border border-zinc-50 dark:border-zinc-800/60">
            <GoalsCard />
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-50 dark:border-zinc-800/60">
        <QuickActions />
      </div>

      {/* ── Charts + right column ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left */}
        <div className="lg:col-span-8 space-y-6">
          {/* Learning Activity Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 h-[450px] relative overflow-hidden shadow-sm hover:shadow-md transition-all border border-zinc-50 dark:border-zinc-800/60">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">
                  Analytics
                </p>
                <h3 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
                  Learning Activity
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-cabin">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Last 7 Days
              </span>
            </div>
            <Charts />
          </div>

          {/* Heatmap */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all border border-zinc-50 dark:border-zinc-800/60">
            <ActivityHeatmap data={analyticsData?.heatmap || []} loading={analyticsLoading} />
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-4 space-y-6">
          {/* Exam Prep */}
          <ExamPrepBanner courses={data?.enrolledCourses || []} />
          {(!data?.enrolledCourses || data.enrolledCourses.length === 0) && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-7 shadow-sm border border-zinc-50 dark:border-zinc-800/60">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-1">Progress</p>
              <h3 className="text-lg font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2">
                Steady Progress
              </h3>
              <p className="text-sm text-zinc-500 font-poppins leading-relaxed">
                Keep exploring materials to stay ahead of your courses.
              </p>
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all border border-zinc-50 dark:border-zinc-800/60">
            <AIInsights />
          </div>

          {/* Continue Reading */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all border border-zinc-50 dark:border-zinc-800/60">
            <ContinueReading />
          </div>
        </div>
      </div>

      {/* ── Browse Materials ─────────────────────────── */}
      <div className="pt-2">
        <AddedMaterials books={data?.books || []} loading={booksLoading} />
      </div>
    </div>
  );
};

export default HomeDashboard;
