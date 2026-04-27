"use client";

import React from "react";
import { motion } from "framer-motion";
import { Map, BookOpen, UserCircle, University, GraduationCap } from "lucide-react";

export const ExpansionVision = () => {
  const steps = [
    { title: "Aspirants", desc: "Prepare for university with practice tests, explore departments, chat with current students, and follow a clear study plan — before you even get in.", icon: <Map className="w-6 h-6 text-[#abc7ff]" /> },
    { title: "Undergraduates", desc: "Read smarter with AI help, chat with classmates, join study groups, track your progress, and climb the leaderboard throughout your degree.", icon: <UserCircle className="w-6 h-6 text-[#abc7ff]" /> },
    { title: "Faculty Reps", desc: "Upload course materials, keep your department's library up to date, and serve as the go-to person for your fellow students.", icon: <GraduationCap className="w-6 h-6 text-[#abc7ff]" /> },
    { title: "Departments", desc: "Organize academic resources, manage courses, and keep track of how students are engaging with the materials.", icon: <BookOpen className="w-6 h-6 text-[#abc7ff]" /> },
    { title: "Institutions", desc: "Roll out a campus-wide digital study platform with full oversight of faculties, departments, and student activity.", icon: <University className="w-6 h-6 text-[#abc7ff]" /> },
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0066FF]/5 via-[#131313] to-[#131313]">
      <div className="text-center mb-16">
        <h2 className="font-manrope text-3xl md:text-5xl font-bold text-white mb-6">
          Built for the Entire Academic Lifecycle
        </h2>
        <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg leading-relaxed">
          UniVault isn&apos;t just an app; it&apos;s an evolving ecosystem designed to scale from the individual aspirant to the highest levels of university administration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
        {/* Connector Line for Desktop */}
        <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
            className="flex flex-col items-center text-center z-10"
          >
            <div className="w-20 h-20 rounded-full bg-[#1c1b1b] border-4 border-[#131313] shadow-[0_0_0_1px_rgba(255,255,255,0.05)] flex items-center justify-center mb-6 relative group">
               <div className="absolute inset-0 bg-[#0066FF] rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
               {step.icon}
            </div>
            <h3 className="font-manrope text-lg font-bold text-white mb-3">
              {step.title}
            </h3>
            <p className="font-inter text-sm text-[#c2c6d8] max-w-xs mx-auto leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
