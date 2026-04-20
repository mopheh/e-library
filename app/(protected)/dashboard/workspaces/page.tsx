"use client";

import React from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { MyCourses } from "@/components/Dashboard/MyCourses";

export default function WorkspacesPage() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-background min-h-screen max-w-7xl mx-auto">
      <div className="space-y-2 mb-8">
        {/* <h1 className="text-3xl lg:text-4xl font-bold font-poppins">My Workspaces</h1> */}
        <p className="text-muted-foreground text-sm font-normal font-poppins">
          Access your enrolled courses, materials, and collaborative rooms.
        </p>
      </div>
      
      <div className="mt-8">
        <MyCourses courses={data?.enrolledCourses || []} loading={isLoading} />
      </div>
    </div>
  );
}
