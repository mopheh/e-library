"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit, BookOpen, Flame, LayoutDashboard,
  MessageSquare, Sparkles, Trophy, Briefcase,
  MonitorPlay, MessageCircle, Activity, Mic,
} from "lucide-react";

const features = [
  {
    title: "AI Study Tutor",
    desc: "Ask anything while reading any textbook page — get clear, step-by-step explanations like having a private tutor on call 24/7.",
    icon: <BrainCircuit className="w-6 h-6" />,
    gradient: "from-violet-500/15 to-violet-600/5",
    iconBg: "bg-violet-500/15 border-violet-500/25 text-violet-400",
    span: "lg:col-span-2 md:col-span-2",
    accentLine: "bg-violet-500",
  },
  {
    title: "Smart Digital Library",
    desc: "Browse resources filtered by faculty, department, and course. Preview and read without ever leaving the platform.",
    icon: <BookOpen className="w-6 h-6" />,
    gradient: "from-blue-500/15 to-blue-600/5",
    iconBg: "bg-blue-500/15 border-blue-500/25 text-blue-400",
    span: "lg:col-span-1",
    accentLine: "bg-blue-500",
  },
  {
    title: "Study Streaks & Progress",
    desc: "Daily streaks, weekly reading stats, and visual progress dashboards keep you consistent and motivated.",
    icon: <Flame className="w-6 h-6" />,
    gradient: "from-amber-500/15 to-amber-600/5",
    iconBg: "bg-amber-500/15 border-amber-500/25 text-amber-400",
    span: "lg:col-span-1",
    accentLine: "bg-amber-500",
  },
  {
    title: "Exam Practice Mode",
    desc: "Timed practice tests built from your course materials. Instant results, detailed breakdowns, and targeted revision hints.",
    icon: <LayoutDashboard className="w-6 h-6" />,
    gradient: "from-emerald-500/15 to-emerald-600/5",
    iconBg: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
    span: "lg:col-span-1",
    accentLine: "bg-emerald-500",
  },
  {
    title: "Lecture Recorder",
    desc: "Record lectures directly inside the app. Review your audio notes anytime alongside your course materials.",
    icon: <Mic className="w-6 h-6" />,
    gradient: "from-cyan-500/15 to-cyan-600/5",
    iconBg: "bg-cyan-500/15 border-cyan-500/25 text-cyan-400",
    span: "lg:col-span-1",
    accentLine: "bg-cyan-500",
  },
  {
    title: "Instant Messaging",
    desc: "Chat with classmates and seniors in real time. Start conversations directly from the library, never lose track of important discussions.",
    icon: <MessageSquare className="w-6 h-6" />,
    gradient: "from-pink-500/15 to-pink-600/5",
    iconBg: "bg-pink-500/15 border-pink-500/25 text-pink-400",
    span: "lg:col-span-1",
    accentLine: "bg-pink-500",
  },
  {
    title: "Ask Seniors",
    desc: "Post questions to senior students in your department and get real, experience-backed answers from people who've been there.",
    icon: <Sparkles className="w-6 h-6" />,
    gradient: "from-indigo-500/15 to-indigo-600/5",
    iconBg: "bg-indigo-500/15 border-indigo-500/25 text-indigo-400",
    span: "lg:col-span-1",
    accentLine: "bg-indigo-500",
  },
  {
    title: "Leaderboard",
    desc: "Earn points by reading and staying active. Top students get featured on the department leaderboard — healthy competition fuels growth.",
    icon: <Trophy className="w-6 h-6" />,
    gradient: "from-yellow-500/15 to-yellow-600/5",
    iconBg: "bg-yellow-500/15 border-yellow-500/25 text-yellow-400",
    span: "lg:col-span-1",
    accentLine: "bg-yellow-500",
  },
  {
    title: "Opportunities Board",
    desc: "Internships, scholarships, hackathons, and job postings — curated by your community so you never miss a career-defining moment.",
    icon: <Briefcase className="w-6 h-6" />,
    gradient: "from-teal-500/15 to-teal-600/5",
    iconBg: "bg-teal-500/15 border-teal-500/25 text-teal-400",
    span: "lg:col-span-1",
    accentLine: "bg-teal-500",
  },
  {
    title: "Study Rooms",
    desc: "Create or join live study sessions for any course. Share notes, tackle past questions, and study with classmates in real time.",
    icon: <MonitorPlay className="w-6 h-6" />,
    gradient: "from-sky-500/15 to-sky-600/5",
    iconBg: "bg-sky-500/15 border-sky-500/25 text-sky-400",
    span: "lg:col-span-1",
    accentLine: "bg-sky-500",
  },
  {
    title: "Course Discussions",
    desc: "Start or join async conversations about any course topic. Share ideas, ask questions, and learn together on your own schedule.",
    icon: <MessageCircle className="w-6 h-6" />,
    gradient: "from-rose-500/15 to-rose-600/5",
    iconBg: "bg-rose-500/15 border-rose-500/25 text-rose-400",
    span: "lg:col-span-1",
    accentLine: "bg-rose-500",
  },
  {
    title: "Mini Academic Tools",
    desc: "GPA calculator, Pomodoro timer, unit converter — powerful productivity tools built right into your study dashboard.",
    icon: <Activity className="w-6 h-6" />,
    gradient: "from-orange-500/15 to-orange-600/5",
    iconBg: "bg-orange-500/15 border-orange-500/25 text-orange-400",
    span: "lg:col-span-1",
    accentLine: "bg-orange-500",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-32 px-6 md:px-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#0a0a0f]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/[0.04] rounded-full blur-3xl" />
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
            <span className="font-inter text-xs font-medium text-[#636e8a] uppercase tracking-widest">Platform Features</span>
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] to-[#a78bfa]">
              ace your academics
            </span>
          </h2>
          <p className="font-inter text-[#636e8a] max-w-2xl mx-auto text-lg leading-relaxed">
            From AI-powered studying to real-time collaboration — every tool a university student needs, woven into one seamless platform.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.04 }}
              className={`group relative rounded-2xl border border-white/[0.06] bg-[#0f0f16] p-6 hover:border-white/[0.12] transition-all duration-500 overflow-hidden ${feature.span}`}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
              {/* Accent line */}
              <div className={`absolute top-0 left-6 right-6 h-[1px] ${feature.accentLine} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl border ${feature.iconBg} flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="font-manrope text-lg font-bold text-white mb-2.5 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="font-inter text-sm text-[#636e8a] leading-relaxed group-hover:text-[#8892b0] transition-colors">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
