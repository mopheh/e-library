"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, GraduationCap, LayoutTemplate, Workflow, Zap, Users } from "lucide-react";

const reasons = [
  {
    icon: <LayoutTemplate className="w-6 h-6" />,
    title: "Structured Environment",
    desc: "No more chaotic folders. Every resource is organized by university, faculty, department, and course — exactly how institutions operate.",
    iconBg: "bg-blue-500/15 border-blue-500/25 text-blue-400",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Built for Universities",
    desc: "Designed around how universities actually work — with built-in support for faculties, departments, course registration, and course representatives.",
    iconBg: "bg-violet-500/15 border-violet-500/25 text-violet-400",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Secure & Reliable",
    desc: "Your data is protected with industry-standard security. The platform is built to handle thousands of concurrent students without slowing down.",
    iconBg: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
  },
  {
    icon: <Workflow className="w-6 h-6" />,
    title: "More Than a PDF Reader",
    desc: "It&apos;s a full study platform with progress tracking, exam practice, real-time discussions, live study rooms, and career opportunities.",
    iconBg: "bg-amber-500/15 border-amber-500/25 text-amber-400",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "AI-Powered Learning",
    desc: "Every textbook page comes with a smart tutor that explains concepts, solves problems step by step, and helps you actually understand — not just memorize.",
    iconBg: "bg-yellow-500/15 border-yellow-500/25 text-yellow-400",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Community-Driven",
    desc: "Message classmates, ask seniors, join study rooms, discuss courses, compete on leaderboards, and discover opportunities — together.",
    iconBg: "bg-pink-500/15 border-pink-500/25 text-pink-400",
  },
];

export const WhyRCF = () => {
  return (
    <section id="institution" className="relative py-32 px-6 md:px-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#080810]">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
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
            <span className="font-inter text-xs font-medium text-[#636e8a] uppercase tracking-widest">Why Choose Us</span>
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Why students choose{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-[#34d399]">
              RCF E-Library
            </span>
          </h2>
          <p className="font-inter text-[#636e8a] max-w-xl mx-auto text-lg leading-relaxed">
            We bridge the gap between institutional structure and the way students actually learn.
          </p>
        </motion.div>

        {/* Reason Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reasons.map((reason, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-[#0f0f16] p-7 hover:border-white/[0.12] transition-all duration-400 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/[0.02] to-transparent transition-opacity duration-500 rounded-2xl" />
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl border ${reason.iconBg} flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300`}>
                  {reason.icon}
                </div>
                <h3 className="font-manrope text-lg font-bold text-white mb-3">{reason.title}</h3>
                <p
                  className="font-inter text-sm text-[#636e8a] leading-relaxed group-hover:text-[#8892b0] transition-colors"
                  dangerouslySetInnerHTML={{ __html: reason.desc }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
