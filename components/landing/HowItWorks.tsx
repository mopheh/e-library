"use client";

import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Create Your Account",
    desc: "Sign up in seconds. Tell us your university, faculty, department, and academic level — we'll personalize everything from there.",
    color: "text-blue-400",
    glow: "bg-blue-500/20",
  },
  {
    num: "02",
    title: "Find Your Materials",
    desc: "Browse a structured library filtered to your exact department. Search any topic and open materials without ever downloading a thing.",
    color: "text-violet-400",
    glow: "bg-violet-500/20",
  },
  {
    num: "03",
    title: "Study with AI Support",
    desc: "Read textbooks inside the platform. Stuck on any concept? Ask the AI tutor and get a clear explanation in seconds — right on the page.",
    color: "text-emerald-400",
    glow: "bg-emerald-500/20",
  },
  {
    num: "04",
    title: "Practice for Exams",
    desc: "Take timed practice tests pulled from your actual course materials. Get instant results and pinpoint exactly what needs more attention.",
    color: "text-amber-400",
    glow: "bg-amber-500/20",
  },
  {
    num: "05",
    title: "Study with Others",
    desc: "Join study rooms, chat with classmates, discuss course topics, and ask seniors — all inside a single, unified platform.",
    color: "text-pink-400",
    glow: "bg-pink-500/20",
  },
  {
    num: "06",
    title: "Track Your Growth",
    desc: "Watch your streaks build, check your stats, see your leaderboard rank, and discover scholarships and opportunities along the way.",
    color: "text-cyan-400",
    glow: "bg-cyan-500/20",
  },
];

export const HowItWorks = () => {
  return (
    <section id="howitworks" className="relative py-32 px-6 md:px-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#080810]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
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
            <span className="font-inter text-xs font-medium text-[#636e8a] uppercase tracking-widest">How It Works</span>
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            From sign-up to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34d399] to-[#60a5fa]">
              academic mastery.
            </span>
          </h2>
          <p className="font-inter text-[#636e8a] max-w-xl mx-auto text-lg">
            A seamless academic workflow — no juggling between apps, no friction, no wasted time.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-[#0f0f16] p-7 hover:border-white/[0.12] transition-all duration-400 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className={`absolute top-4 right-4 w-16 h-16 ${step.glow} rounded-full blur-2xl`} />
              </div>

              <div className="relative">
                <div className={`font-manrope text-4xl font-black ${step.color} opacity-20 mb-5 leading-none`}>
                  {step.num}
                </div>
                <h3 className="font-manrope text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="font-inter text-sm text-[#636e8a] leading-relaxed group-hover:text-[#8892b0] transition-colors">
                  {step.desc}
                </p>
              </div>

              {/* Step connector dot */}
              <div className={`absolute bottom-5 right-5 w-1.5 h-1.5 rounded-full ${step.color.replace('text-', 'bg-')} opacity-40`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
