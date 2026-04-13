"use client";

import React from "react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { MyCourses } from "@/components/Dashboard/MyCourses";
import { PlayCircle, Clock, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkspacesPage() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-8 bg-background min-h-screen max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold font-cabin text-foreground tracking-tight">Academic Workspaces</h1>
          <p className="text-muted-foreground text-sm font-normal font-poppins font-light leading-relaxed">
            Your centralized hub for enrolled courses, materials, and collaborative rooms.
          </p>
        </div>
      </div>

      {/* ⚡ Continue Learning Banner */}
      {!isLoading && data?.enrolledCourses && data.enrolledCourses.length > 0 && (
         <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 border-none shadow-xl shadow-blue-500/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <BookOpen className="w-48 h-48 text-white" />
            </div>
            <CardContent className="p-6 md:p-10 relative z-10">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 text-center md:text-left">
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-blue-100 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                        <Clock className="w-3 h-3" /> Resume Learning
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold text-white font-cabin">Continue where you left off</h2>
                     <p className="text-blue-100/80 text-sm font-poppins max-w-md font-light">
                        Jump back into your last accessed material and keep up with your study goals.
                     </p>
                  </div>
                  <Link href={`/dashboard/workspaces/${data.enrolledCourses[0].id}`}>
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl px-8 h-12 shadow-lg group">
                       Enter Workspace <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
               </div>
            </CardContent>
         </Card>
      )}

      {/* Main Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-medium font-cabin">My Enrolled Courses</h3>
           <div className="text-xs text-muted-foreground font-poppins">
              Showing {data?.enrolledCourses?.length || 0} active workspaces
           </div>
        </div>
        <MyCourses courses={data?.enrolledCourses || []} loading={isLoading} />
      </div>
    </div>
  );
}
