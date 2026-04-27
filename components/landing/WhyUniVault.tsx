"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, GraduationCap, LayoutTemplate, Workflow, Zap, Users } from "lucide-react";

export const WhyUniVault = () => {
  const reasons = [
    { title: "Structured Environment", desc: "No more chaotic folders. Every resource is organized by university, faculty, department, and course — exactly how institutions operate.", icon: <LayoutTemplate /> },
    { title: "Built for Universities", desc: "Designed for how universities actually work — with built-in support for faculties, departments, course registration, and student representatives.", icon: <GraduationCap /> },
    { title: "Secure & Reliable", desc: "Your data is protected with industry-leading security. The platform is built to handle thousands of students without slowing down.", icon: <ShieldCheck /> },
    { title: "More Than a PDF Reader", desc: "It's not just about reading — it's a full study platform with progress tracking, exam practice, discussions, and real collaboration tools.", icon: <Workflow /> },
    { title: "AI-Powered Learning", desc: "Every textbook page comes with a smart tutor that explains concepts, solves problems step by step, and helps you actually understand what you're reading.", icon: <Zap /> },
    { title: "Community-Driven", desc: "Message classmates, ask seniors for advice, join study rooms, discuss courses, compete on leaderboards, and discover career opportunities — together.", icon: <Users /> },
  ];

  return (
    <section id="institution" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="font-manrope text-3xl md:text-5xl font-bold text-white mb-6">
          Why UniVault?
        </h2>
        <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg">
          We bridge the gap between institutional requirements and student learning experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reasons.map((reason, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#abc7ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-[#131313] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#1c1b1b] border border-white/5 flex items-center justify-center text-[#abc7ff] mb-6">
                {reason.icon}
              </div>
              <h3 className="font-manrope text-lg font-bold text-white mb-3">
                {reason.title}
              </h3>
              <p className="font-inter text-sm text-[#c2c6d8] leading-relaxed">
                {reason.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
