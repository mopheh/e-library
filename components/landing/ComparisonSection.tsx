"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { label: "Course Materials", old: "Scattered PDFs & WhatsApp links", rcf: "Organized by faculty & course" },
  { label: "Progress Tracking", old: "No visibility whatsoever", rcf: "Visual streaks & reading stats" },
  { label: "Exam Preparation", old: "Random past question hunting", rcf: "Timed practice tests + instant results" },
  { label: "Getting Advice", old: "Figure it out alone", rcf: "Ask seniors directly in-app" },
  { label: "Studying Together", old: "Isolated, disconnected reading", rcf: "Study rooms, discussions & live chat" },
  { label: "Opportunities", old: "Searching social media on your own", rcf: "Curated internships, jobs & scholarships" },
  { label: "Content Help", old: "Stuck with no explanation", rcf: "AI tutor explains any page, anytime" },
  { label: "Motivation", old: "Easy to drift and lose momentum", rcf: "Streaks, points & leaderboard rankings" },
];

export const ComparisonSection = () => {
  return (
    <section className="relative py-28 px-6 md:px-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#0a0a0f]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <span className="font-inter text-xs font-medium text-[#636e8a] uppercase tracking-widest">The Difference</span>
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            More than just an{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-[#a78bfa]">
              e-library.
            </span>
          </h2>
          <p className="font-inter text-[#636e8a] max-w-xl mx-auto text-lg">
            See why scattered PDF readers fall short — and what a real academic platform actually gives you.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_0_60px_rgba(0,87,231,0.08)]"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 border-b border-white/[0.07]">
            <div className="p-5 bg-[#0f0f16] border-r border-white/[0.07]">
              <span className="font-inter text-xs font-semibold text-[#4a5568] uppercase tracking-widest">Feature</span>
            </div>
            <div className="p-5 bg-[#0f0f16] text-center border-r border-white/[0.07]">
              <span className="font-manrope text-base font-bold text-[#4a5568]">Traditional PDFs</span>
            </div>
            <div className="p-5 bg-gradient-to-r from-blue-500/10 to-violet-500/10 text-center">
              <span className="font-manrope text-base font-bold text-[#60a5fa]">RCF E-Library</span>
            </div>
          </div>

          {/* Table Rows */}
          {rows.map((row, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-3 border-b border-white/[0.05] group hover:bg-white/[0.01] transition-colors ${idx === rows.length - 1 ? "border-b-0" : ""}`}
            >
              <div className="p-4 bg-[#0f0f16] border-r border-white/[0.07] flex items-center">
                <span className="font-inter text-sm font-medium text-[#8892b0]">{row.label}</span>
              </div>
              <div className="p-4 bg-[#0f0f16] border-r border-white/[0.07] flex items-center justify-center gap-2">
                <X className="w-4 h-4 text-red-400/70 shrink-0" />
                <span className="font-inter text-xs text-[#4a5568] text-center">{row.old}</span>
              </div>
              <div className="p-4 bg-blue-500/[0.03] flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-inter text-xs text-[#8892b0] text-center font-medium">{row.rcf}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
