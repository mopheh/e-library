import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import KPICards from "./Analytics/KPICards";
import WeeklyTrends from "./Analytics/WeeklyTrends";
import ActivityHeatmap from "./Analytics/ActivityHeatmap";
import GoalsCard from "./Analytics/GoalsCard";
import AIInsights from "./Analytics/AIInsights";
import ContinueReading from "./Analytics/ContinueReading";
import { useAnalytics } from "@/hooks/useAnalytics";
import Charts from "./Charts";
import { CourseRegistrationModal } from "@/components/Dashboard/CourseRegistration";
import HomeDashboardSkeleton from "@/components/Dashboard/HomeDashboardSkeleton";
import CourseDiscussions from "./CourseDiscussions";
import { ExamPrepBanner } from "@/components/Dashboard/ExamPrepBanner";
import { AcademicFeed } from "@/components/Dashboard/AcademicFeed";
import AddedMaterials from "./AddedMaterials";

const HomeDashboard = () => {
  const today = new Date();
  const resumptionDate = new Date(2025, 2, 3); // March 3, 2025
  const examDate = new Date(2025, 9, 14);
  const daysToExam = Math.max(
    0,
    Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const { data, isLoading: booksLoading } = useDashboard();
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();

  if (booksLoading || analyticsLoading) {
    return <HomeDashboardSkeleton />;
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-background">
      <CourseRegistrationModal departmentId={data?.user?.departmentId} />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
            {/* Date Picker or Filters could go here */}
        </div>
      </div>
      
      {/* 0. Exam Prep Banner (Only shows if exams <= 14 days) */}
      <ExamPrepBanner courses={data?.enrolledCourses || []} />

      {/* 1. Key Performance Indicators */}
      <KPICards 
        booksRead={analyticsData?.kpis?.booksRead || 0} 
        minutesRead={analyticsData?.kpis?.minutesRead || 0} 
        streak={analyticsData?.kpis?.streak || 0} 
        loading={analyticsLoading}
      />

      {/* 2. My Courses Workspace (Moved to Sidebar) */}

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
        
        {/* Left Column (Trends & Activity) - Spans 4 columns on large screens */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-6">
            {/* Weekly Trends Chart */}
            <div className="bg-white dark:bg-zinc-950 rounded-lg w-full p-3 h-[400px] relative overflow-hidden font-poppins">
              <h3 className="text-base font-semibold mb-4 font-open-sans">
                Reading Activity (Last 7 Days)
              </h3>
              <Charts />
            </div>
            
            {/* Recent Activity Heatmap */}
            <div className="grid grid-cols-1 gap-6">
                 <ActivityHeatmap data={analyticsData?.heatmap || []} loading={analyticsLoading} />
            </div>

            {/* Daily Academic Feed */}
            {/* <div className="mt-8">
               <AcademicFeed />
            </div> */}
        </div>
        
        {/* Right Column (Goals, AI, Continue Reading) - Spans 3 columns on large screens */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-6">
            {/* Goals & AI Stacked */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 mt-6 lg:mt-0">
                <GoalsCard />
                <AIInsights />
            </div>

            {/* Continue Reading / Recently Viewed */}
            <ContinueReading />
        </div>
      </div>

       {/* Discussions Section */}
       {/* {data?.books?.[0]?.course && (
         <div className="mt-8 border-t pt-8">
           <CourseDiscussions courseId={data.books[0].courseId} courseName={data.books[0].course} />
         </div>
       )} */}

       {/* 3. Browse / Suggestions Section (Legacy AddedMaterials) */}
       {/* Replaced by Academic Feed above */}
       <AddedMaterials books={data?.books || []} loading={booksLoading} />
    </div>
  );
};
export default HomeDashboard;
