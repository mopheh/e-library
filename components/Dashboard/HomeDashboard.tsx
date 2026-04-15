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

const HomeDashboard = () => {
  const { data, isLoading: booksLoading } = useDashboard();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();

  if (booksLoading || analyticsLoading) {
    return <HomeDashboardSkeleton />;
  }

  return (
    <div className="flex-1 p-2 md:p-8 pt-6 space-y-8 premium-bg min-h-screen">
      <CourseRegistrationModal departmentId={data?.user?.departmentId} />

      {/* 0. Top Section: Carousel & Exam Prep */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
           <StudyCarousel />
        </div>
        <div className="lg:col-span-4 h-full">
           <ExamPrepBanner courses={data?.enrolledCourses || []} />
           {(!data?.enrolledCourses || data.enrolledCourses.length === 0) && (
              <div className="glass-card p-8 h-full rounded-[2rem] flex flex-col justify-center border-emerald-100 dark:border-emerald-900/30">
                 <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2 font-poppins">Steady Progress</h3>
                 <p className="text-sm text-zinc-500 font-poppins">You're doing great! Keep exploring materials to stay ahead of your courses.</p>
              </div>
           )}
        </div>
      </div>
      
      {/* 1. Key Performance Indicators */}
      <div className="glass-card p-2 rounded-[2.5rem]">
        <KPICards 
          booksRead={(analyticsData as any)?.kpis?.booksRead || 0} 
          minutesRead={(analyticsData as any)?.kpis?.minutesRead || 0} 
          streak={(analyticsData as any)?.kpis?.streak || 0} 
          daysToExam={(analyticsData as any)?.kpis?.daysToExam}
          totalAiRequests={(analyticsData as any)?.kpis?.totalAiRequests}
          loading={analyticsLoading}
        />
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        
        {/* Left Column (Trends & Activity) */}
        <div className="lg:col-span-4 space-y-8">
            {/* Weekly Trends Chart */}
            <div className="glass-card rounded-[2.5rem] w-full p-8 h-[450px] relative overflow-hidden font-poppins">
              <h3 className="text-lg font-bold mb-6 font-poppins flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                Reading Activity
              </h3>
              <Charts />
            </div>
            
            {/* Recent Activity Heatmap */}
            <div className="glass-card p-6 rounded-[2.5rem]">
                 <ActivityHeatmap data={analyticsData?.heatmap || []} loading={analyticsLoading} />
            </div>
        </div>
        
        {/* Right Column (Goals, AI, Continue Reading) */}
        <div className="lg:col-span-3 space-y-8">
            {/* Goals & AI Stacked */}
            <div className="grid gap-8 mt-6 lg:mt-0">
                <div className="glass-card rounded-[2.5rem]">
                  <GoalsCard />
                </div>
                <div className="glass-card rounded-[2.5rem]">
                   <AIInsights />
                </div>
            </div>

            {/* Continue Reading / Recently Viewed */}
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
               <ContinueReading />
            </div>
        </div>
      </div>

       {/* 3. Browse / Suggestions Section */}
       <div className="pt-8">
          <div className="flex items-center justify-between mb-6 px-4">
             <h2 className="text-2xl font-bold font-poppins text-zinc-800 dark:text-zinc-100 italic">Recommended for You</h2>
             <span className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full">New Arrivals</span>
          </div>
          <AddedMaterials books={data?.books || []} loading={booksLoading} />
       </div>
    </div>
  );
};

export default HomeDashboard;
