"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, BookOpen, BrainCircuit, Flame, MessageSquare, Trophy, GraduationCap, Sparkles } from "lucide-react";

const floatingCards = [
  {
    icon: <BrainCircuit className="w-4 h-4 text-violet-400" />,
    title: "AI Study Tutor",
    sub: "Explain any concept instantly",
    color: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/20",
    delay: 0,
  },
  {
    icon: <BookOpen className="w-4 h-4 text-blue-400" />,
    title: "Smart Library",
    sub: "Filtered by dept & course",
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
    delay: 0.15,
  },
  {
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    title: "Study Streaks",
    sub: "5-day streak 🔥",
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/20",
    delay: 0.3,
  },
  {
    icon: <MessageSquare className="w-4 h-4 text-pink-400" />,
    title: "Live Messaging",
    sub: "Chat with classmates",
    color: "from-pink-500/20 to-pink-600/5",
    border: "border-pink-500/20",
    delay: 0.45,
  },
  {
    icon: <Trophy className="w-4 h-4 text-yellow-400" />,
    title: "Leaderboard",
    sub: "Ranked #3 in your dept",
    color: "from-yellow-500/20 to-yellow-600/5",
    border: "border-yellow-500/20",
    delay: 0.6,
  },
  {
    icon: <GraduationCap className="w-4 h-4 text-emerald-400" />,
    title: "Exam Practice",
    sub: "Timed tests + instant results",
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    delay: 0.75,
  },
];

const stats = [
  { value: "11+", label: "Core Features" },
  { value: "24/7", label: "AI Availability" },
  { value: "100%", label: "Free to Use" },
];

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-20 px-6 md:px-12 overflow-hidden">
      {/* Multi-layered background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0057e7] rounded-full blur-[180px] opacity-[0.12]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#7c3aed] rounded-full blur-[150px] opacity-[0.08]" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#0099ff] rounded-full blur-[120px] opacity-[0.07]" />
      </div>

      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-20">
        {/* Left — Text Content */}
        <div className="flex-1 flex flex-col items-start">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#0057e7]/40 bg-[#0057e7]/10 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#60a5fa]" />
            <span className="font-inter text-xs font-medium text-[#93c5fd] tracking-wide uppercase">
              RCF E-Library · Your Academic Home
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-manrope text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-6 tracking-tight"
          >
            Study Smarter.
            <br />
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] via-[#818cf8] to-[#a78bfa]">
                Excel Further.
              </span>
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-inter text-lg md:text-xl text-[#8892b0] leading-relaxed mb-10 max-w-lg"
          >
            Your complete academic platform — AI-powered study tools, a structured digital library, real-time collaboration, and career opportunities. All in one place, built for university students.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-12"
          >
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative px-8 py-4 rounded-xl font-inter font-semibold text-white overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0057e7] to-[#0099ff]" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#0040c8] to-[#0080ee] transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    Start Learning Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="group relative px-8 py-4 rounded-xl font-inter font-semibold text-white overflow-hidden transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#0057e7] to-[#0099ff]" />
                <span className="relative flex items-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </SignedIn>
            <Link
              href="#features"
              className="px-8 py-4 rounded-xl font-inter font-semibold text-[#c2c6d8] border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-center"
            >
              See Features
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex items-center gap-8"
          >
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="font-manrope text-2xl font-bold text-white">{stat.value}</span>
                <span className="font-inter text-xs text-[#636e8a]">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — Feature Cards Grid */}
        <div className="flex-1 w-full max-w-lg">
          <div className="grid grid-cols-2 gap-3 relative">
            {/* Central glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
            </div>
            {floatingCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + card.delay }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`relative rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} backdrop-blur-sm p-4 cursor-default overflow-hidden group`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.02]" />
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center mb-3 border border-white/5">
                    {card.icon}
                  </div>
                  <p className="font-manrope text-sm font-bold text-white mb-0.5">{card.title}</p>
                  <p className="font-inter text-xs text-[#8892b0]">{card.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-inter text-xs text-[#4a5568] uppercase tracking-widest">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-[#0057e7]/50 to-transparent"
        />
      </motion.div>
    </section>
  );
};
