"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { OpportunitiesBoard } from "@/components/Dashboard/OpportunitiesBoard";
import { Briefcase } from "lucide-react";

export default function OpportunitiesPage() {
  const { isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded || !isSignedIn) {
    return <div className="h-screen w-full bg-muted/20 animate-pulse"></div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-background min-h-screen max-w-7xl mx-auto">
      <div className="space-y-3 mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold font-cabin flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-blue-500" />
          Opportunities Board
        </h1>
        <p className="text-muted-foreground text-sm font-poppins">
          Discover and share internships, scholarships, hackathons, and job offers curated for your department.
        </p>
      </div>

      <div className="mt-8">
         <OpportunitiesBoard />
      </div>
    </div>
  );
}
