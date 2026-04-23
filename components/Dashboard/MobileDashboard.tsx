"use client";

import React from "react";
import MobileHeader from "./MobileHeader";
import MobileStudyCarousel from "./MobileStudyCarousel";
import QuickActions from "./QuickActions";
import StreakTracker from "./StreakTracker";
import CurrentCourse from "./CurrentCourse";
import { motion } from "framer-motion";

export default function MobileDashboard() {
  return (
    <div className="flex flex-col space-y-7 pb-32 premium-bg min-h-screen font-poppins bg-white dark:bg-zinc-950">
      
      {/* 0. Mobile Header */}
      <MobileHeader />

      {/* 1. Carousel Section */}
      <section className="px-4">
        <MobileStudyCarousel />
      </section>

      {/* 2. Quick Actions */}
      <section>
        <QuickActions />
      </section>

      {/* 3. Streaks */}
      <section className="h-full">
         <StreakTracker />
      </section>

      {/* 4. Current Course Section */}
      <section>
        <CurrentCourse />
      </section>
    </div>
  );
}

