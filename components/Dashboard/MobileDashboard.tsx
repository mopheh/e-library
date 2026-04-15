"use client";

import React from "react";
import StudyCarousel from "./StudyCarousel";
import QuickActions from "./QuickActions";
import StreakTracker from "./StreakTracker";
import LastReadFeed from "./LastReadFeed";
import { motion } from "framer-motion";

export default function MobileDashboard() {
  return (
    <div className="flex flex-col space-y-8 pb-24 premium-bg min-h-screen pt-2 font-poppins">
      
      {/* 1. Carousel Section */}
      <section className="px-4">
        <StudyCarousel />
      </section>

      {/* 2. Quick Actions */}
      <section className="px-4">
        <QuickActions />
      </section>

      {/* 3. Streaks */}
      <section className="px-4 h-full">
         <StreakTracker />
      </section>

      {/* 4. Recent Activity / Last Read */}
      <section>
        <LastReadFeed />
      </section>
    </div>
  );
}
