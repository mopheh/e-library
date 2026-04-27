"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  BookOpen,
  Activity,
  LayoutDashboard,
  Building2,
  MessageSquare,
  Sparkles,
  Trophy,
  Briefcase,
  MonitorPlay,
  MessageCircle,
  Flame,
} from "lucide-react";

const features = [
  {
    title: "AI Study Tutor",
    desc: "Ask questions while reading any textbook page and get clear, step-by-step explanations — like having a private tutor available 24/7.",
    icon: <BrainCircuit className="w-6 h-6" />,
    color: "from-violet-500/20 to-violet-600/5",
    iconBg: "bg-violet-500/10 text-violet-400",
    span: "lg:col-span-2",
  },
  {
    title: "Smart Digital Library",
    desc: "Browse structured academic resources filtered by faculty, department, and course. Search instantly, preview before reading, and pick up where you left off.",
    icon: <BookOpen className="w-6 h-6" />,
    color: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/10 text-blue-400",
    span: "lg:col-span-1",
  },
  {
    title: "Study Streak & Progress",
    desc: "Stay consistent with daily reading streaks and see your study habits visualized week by week. Know exactly where you stand.",
    icon: <Flame className="w-6 h-6" />,
    color: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/10 text-amber-400",
    span: "lg:col-span-1",
  },
  {
    title: "Exam Practice Mode",
    desc: "Take timed practice tests based on your course materials. Get instant results with detailed breakdowns so you know exactly what to revise.",
    icon: <LayoutDashboard className="w-6 h-6" />,
    color: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/10 text-emerald-400",
    span: "lg:col-span-1",
  },
  {
    title: "Instant Messaging",
    desc: "Chat with classmates and seniors in real time. Start conversations from anywhere in the app and never lose track of important discussions.",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "from-pink-500/20 to-pink-600/5",
    iconBg: "bg-pink-500/10 text-pink-400",
    span: "lg:col-span-1",
  },
  {
    title: "Ask Seniors",
    desc: "Got a question about a tough course or campus life? Post it to senior students in your department and get real answers from people who've been there.",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-indigo-500/20 to-indigo-600/5",
    iconBg: "bg-indigo-500/10 text-indigo-400",
    span: "lg:col-span-1",
  },
  {
    title: "Leaderboard",
    desc: "See how you rank among your classmates. Earn points by reading and staying active — top students get featured on the department leaderboard.",
    icon: <Trophy className="w-6 h-6" />,
    color: "from-yellow-500/20 to-yellow-600/5",
    iconBg: "bg-yellow-500/10 text-yellow-400",
    span: "lg:col-span-1",
  },
  {
    title: "Opportunities Board",
    desc: "Discover internships, scholarships, hackathons, and job openings posted by your community. Never miss a career-defining opportunity again.",
    icon: <Briefcase className="w-6 h-6" />,
    color: "from-teal-500/20 to-teal-600/5",
    iconBg: "bg-teal-500/10 text-teal-400",
    span: "lg:col-span-1",
  },
  {
    title: "Study Rooms",
    desc: "Create or join live study sessions for any course. Share notes, tackle past questions together, and study with your classmates in real time.",
    icon: <MonitorPlay className="w-6 h-6" />,
    color: "from-cyan-500/20 to-cyan-600/5",
    iconBg: "bg-cyan-500/10 text-cyan-400",
    span: "lg:col-span-1",
  },
  {
    title: "Course Discussions",
    desc: "Start or join conversations about any course topic. Share ideas, ask questions, and help each other — even when you're not studying at the same time.",
    icon: <MessageCircle className="w-6 h-6" />,
    color: "from-rose-500/20 to-rose-600/5",
    iconBg: "bg-rose-500/10 text-rose-400",
    span: "lg:col-span-1",
  },
  {
    title: "Course Workspaces",
    desc: "Everything for each course in one place — your materials, study rooms, discussions, and progress all organized and ready to go.",
    icon: <Activity className="w-6 h-6" />,
    color: "from-orange-500/20 to-orange-600/5",
    iconBg: "bg-orange-500/10 text-orange-400",
    span: "lg:col-span-1",
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-inter uppercase tracking-widest text-[#abc7ff] mb-6">
            Everything You Need
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-bold text-white mb-6">
            A Complete Academic{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#abc7ff] to-[#0066FF]">
              Ecosystem
            </span>
          </h2>
          <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg leading-relaxed">
            From AI-powered studying to real-time collaboration — every tool a student needs, built into one platform.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: idx * 0.04 }}
            className={`group relative rounded-2xl border border-white/[0.06] bg-[#1c1b1b] p-6 hover:border-white/[0.12] transition-all duration-500 overflow-hidden ${feature.span}`}
          >
            {/* Gradient overlay on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />

            <div className="relative z-10">
              <div
                className={`w-11 h-11 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300`}
              >
                {feature.icon}
              </div>
              <h3 className="font-manrope text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                {feature.title}
              </h3>
              <p className="font-inter text-sm text-[#9da1b3] leading-relaxed group-hover:text-[#c2c6d8] transition-colors">
                {feature.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
