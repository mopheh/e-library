"use client";

import React from "react";
import { motion } from "framer-motion";
import { Files, LineChart, SearchX, Frown } from "lucide-react";

const problems = [
  {
    icon: <Files className="w-5 h-5" />,
    title: "Scattered Materials",
    desc: "Course PDFs scattered across WhatsApp groups, emails, and random folders — impossible to find when you need them.",
    gradient: "from-red-500/10 to-red-600/5",
    iconColor: "text-red-400",
    iconBg: "bg-red-500/10 border-red-500/20",
  },
  {
    icon: <LineChart className="w-5 h-5" />,
    title: "No Progress Visibility",
    desc: "No way to know how much of the syllabus you've covered, or where your weaknesses actually lie.",
    gradient: "from-orange-500/10 to-orange-600/5",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: <SearchX className="w-5 h-5" />,
    title: "Exam Unpreparedness",
    desc: "Struggling to find relevant practice questions or simulate real exam conditions before the actual test.",
    gradient: "from-yellow-500/10 to-yellow-600/5",
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    icon: <Frown className="w-5 h-5" />,
    title: "Studying in Isolation",
    desc: "Stuck on a concept with no one to ask. No quick way to reach classmates, seniors, or get expert help.",
    gradient: "from-rose-500/10 to-rose-600/5",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
  },
];

export const ProblemSection = () => {
  return (
    <section className="relative py-28 px-6 md:px-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#0a0a0f]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <span className="font-inter text-xs font-medium text-[#636e8a] uppercase tracking-widest">The Problem</span>
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Studying is hard enough.{" "}
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f87171] to-[#fb923c]">
              The tools shouldn&apos;t make it harder.
            </span>
          </h2>
          <p className="font-inter text-[#636e8a] max-w-xl mx-auto text-lg leading-relaxed">
            Every student faces the same friction points. We built RCF E-Library to eliminate all of them.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {problems.map((prob, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`group relative rounded-2xl border border-white/[0.06] bg-gradient-to-br ${prob.gradient} bg-[#111118] p-7 hover:border-white/[0.12] transition-all duration-400 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-[#111118] -z-10 rounded-2xl" />
              <div className="flex items-start gap-5">
                <div className={`shrink-0 w-10 h-10 rounded-xl border ${prob.iconBg} ${prob.iconColor} flex items-center justify-center`}>
                  {prob.icon}
                </div>
                <div>
                  <h3 className="font-manrope text-lg font-bold text-white mb-2">{prob.title}</h3>
                  <p className="font-inter text-sm text-[#636e8a] leading-relaxed">{prob.desc}</p>
                </div>
              </div>
              {/* Decorative corner */}
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-white/[0.02] to-transparent rounded-tl-3xl" />
            </motion.div>
          ))}
        </div>

        {/* Bridge Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="font-inter text-lg text-[#4a5568] max-w-md mx-auto">
            We identified every friction point and built a platform that solves them all, together.
          </p>
          <div className="mt-6 inline-flex items-center gap-2">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#0057e7]/50" />
            <div className="w-2 h-2 rounded-full bg-[#0057e7]/50" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#0057e7]/50" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
