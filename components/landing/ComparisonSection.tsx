"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export const ComparisonSection = () => {
  const features = [
    { label: "Finding Materials", traditional: "Scattered PDFs & random folders", univault: "Organized by faculty & department" },
    { label: "Tracking Progress", traditional: "No way to know where you are", univault: "Visual streaks & reading stats" },
    { label: "Exam Preparation", traditional: "No practice tools", univault: "Timed practice tests with instant results" },
    { label: "Getting Advice", traditional: "Figure it out alone", univault: "Ask seniors directly from the app" },
    { label: "Studying Together", traditional: "Isolated reading", univault: "Study rooms, discussions & live chat" },
    { label: "Finding Opportunities", traditional: "Searching on your own", univault: "Curated jobs, internships & scholarships" },
    { label: "Understanding Content", traditional: "No help available", univault: "AI tutor explains any page" },
    { label: "Staying Motivated", traditional: "Easy to lose focus", univault: "Streaks, points & leaderboard rankings" },
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto border-t border-white/5">
      <div className="text-center mb-16">
        <h2 className="font-manrope text-3xl md:text-5xl font-bold text-white mb-6">
          More Than Just an E-Library
        </h2>
        <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg">
          See why standard PDF readers fall short when it comes to true academic preparation.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-white/10 bg-[#1c1b1b] overflow-hidden shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 font-inter">
          {/* Header */}
          <div className="hidden md:block col-span-1 p-6 border-b border-white/5 bg-[#131313]/50">
            <span className="text-[#8c90a1] font-semibold text-sm uppercase tracking-wider">Features</span>
          </div>
          <div className="p-6 border-b border-white/5 bg-[#131313] md:border-l text-center">
            <span className="font-manrope text-xl font-bold text-white">Traditional PDFs</span>
          </div>
          <div className="p-6 border-b border-white/5 bg-[#0066FF]/10 md:border-l text-center border-l-white/10">
            <span className="font-manrope text-xl font-bold text-[#abc7ff]">UniVault</span>
          </div>

          {/* Rows */}
          {features.map((row, idx) => (
            <React.Fragment key={idx}>
              <div className="hidden md:flex items-center p-5 border-b border-white/5 bg-[#131313]/50">
                <span className="text-white font-medium text-sm">{row.label}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-center p-5 border-b border-white/5 bg-[#131313] md:border-l text-center gap-2">
                 <span className="md:hidden text-xs text-[#8c90a1] uppercase">{row.label} (Traditional)</span>
                 <div className="flex items-center justify-center gap-2 text-[#c2c6d8] text-sm">
                   <X className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                   <span>{row.traditional}</span>
                 </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-center p-5 border-b border-white/5 bg-[#0066FF]/5 md:border-l text-center border-l-white/10 gap-2">
                 <span className="md:hidden text-xs text-[#abc7ff] uppercase">{row.label} (UniVault)</span>
                 <div className="flex items-center justify-center gap-2 text-white font-medium text-sm">
                   <Check className="w-5 h-5 text-[#abc7ff] shrink-0" />
                   <span>{row.univault}</span>
                 </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
