"use client";

import React from "react";
import { motion } from "framer-motion";
import { Map, UserCircle, GraduationCap, BookOpen, University, ChevronRight } from "lucide-react";

const personas = [
  {
    icon: <Map className="w-5 h-5" />,
    title: "Aspirants",
    desc: "Prepare for university with practice tests, department previews, senior connections, and guided roadmaps — before you even get in.",
    iconBg: "bg-blue-500/15 border-blue-500/25 text-blue-400",
    gradient: "from-blue-500/10 to-blue-600/5",
    count: "Start today",
  },
  {
    icon: <UserCircle className="w-5 h-5" />,
    title: "Undergraduates",
    desc: "Read smarter with AI, chat with classmates, join study groups, track your progress, and climb the leaderboard throughout your degree.",
    iconBg: "bg-violet-500/15 border-violet-500/25 text-violet-400",
    gradient: "from-violet-500/10 to-violet-600/5",
    count: "Core users",
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "Course Reps",
    desc: "Upload and manage course materials, keep your department&apos;s library current, and serve as the go-to academic resource hub for your peers.",
    iconBg: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    count: "Content managers",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Departments",
    desc: "Organize academic resources, manage courses, and track how students engage with materials across your entire department.",
    iconBg: "bg-amber-500/15 border-amber-500/25 text-amber-400",
    gradient: "from-amber-500/10 to-amber-600/5",
    count: "Departments",
  },
  {
    icon: <University className="w-5 h-5" />,
    title: "Institutions",
    desc: "Roll out a campus-wide digital study platform with full oversight of faculties, departments, and real-time student activity.",
    iconBg: "bg-rose-500/15 border-rose-500/25 text-rose-400",
    gradient: "from-rose-500/10 to-rose-600/5",
    count: "Campus-wide",
  },
];

export const ExpansionVision = () => {
  return (
    <section id="community" className="relative py-32 px-6 md:px-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#0a0a0f]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,87,231,0.04)_0%,transparent_70%)]" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <span className="font-inter text-xs font-medium text-[#636e8a] uppercase tracking-widest">Built For Everyone</span>
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Built for the entire
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-[#f472b6]">
              academic lifecycle.
            </span>
          </h2>
          <p className="font-inter text-[#636e8a] max-w-xl mx-auto text-lg leading-relaxed">
            Whether you&apos;re a hopeful aspirant or a department administrator, RCF E-Library is built to serve you at every stage.
          </p>
        </motion.div>

        {/* Persona Cards */}
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {personas.map((p, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`group relative flex items-center gap-6 rounded-2xl border border-white/[0.06] bg-gradient-to-r ${p.gradient} bg-[#0f0f16] px-7 py-6 hover:border-white/[0.12] transition-all duration-400 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-[#0f0f16] -z-10 rounded-2xl" />
              <div className={`shrink-0 w-11 h-11 rounded-xl border ${p.iconBg} flex items-center justify-center`}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-manrope text-base font-bold text-white">{p.title}</h3>
                  <span className="font-inter text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest border border-white/5 px-2.5 py-1 rounded-full bg-white/[0.02]">
                    {p.count}
                  </span>
                </div>
                <p className="font-inter text-sm text-[#636e8a] leading-relaxed group-hover:text-[#8892b0] transition-colors line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: p.desc }}
                />
              </div>
              <ChevronRight className="shrink-0 w-5 h-5 text-[#2a3444] group-hover:text-[#4a5568] transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
