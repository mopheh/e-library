"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { AskSeniorsBoard } from "@/components/Dashboard/AskSeniorsBoard";
import { Sparkles } from "lucide-react";

export default function AskSeniorsPage() {
  const { isLoaded, isSignedIn } = useUser();
  
  if (!isLoaded || !isSignedIn) {
    return <div className="h-screen w-full bg-muted/20 animate-pulse"></div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-background min-h-screen max-w-7xl mx-auto">
      <div className="space-y-3 mb-8">
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight font-cabin flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          Ask Seniors
        </h1>
        <p className="text-muted-foreground font-light text-sm font-poppins">
          A dedicated space to ask questions, seek mentorship, and interact with senior students in your department.
        </p>
      </div>

      <div className="mt-8">
         <AskSeniorsBoard />
      </div>
    </div>
  );
}
