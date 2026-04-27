"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, MessageSquare, Flame } from "lucide-react";

export const HeroSection = () => {
  const stats = [
    { label: "Study Tools", value: "12+", icon: <BrainCircuit className="w-3.5 h-3.5" /> },
    { label: "AI Tutor", value: "24/7", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { label: "Messaging", value: "Live", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  return (
    <section className="relative pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0066FF] rounded-full blur-[120px] opacity-20 -z-10" />

      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 flex flex-col items-start"
      >
        <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-inter uppercase tracking-widest text-[#abc7ff] mb-6">
          Study · Collaborate · Excel
        </div>
        <h1 className="font-manrope text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Your Complete Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#abc7ff] to-[#0066FF]">Study Hub</span>
        </h1>
        <p className="font-inter text-lg text-[#c2c6d8] leading-relaxed mb-8 max-w-2xl">
          Study smarter with an AI tutor, stay connected with classmates, practice for exams, and track your progress — everything you need from admission prep to graduation, in one place.
        </p>

        {/* Mini stat badges */}
        <div className="flex flex-wrap gap-3 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/[0.08] text-xs font-inter text-[#c2c6d8]"
            >
              <span className="text-[#abc7ff]">{stat.icon}</span>
              <span className="font-bold text-white">{stat.value}</span>
              <span>{stat.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto px-8 py-3.5 rounded-md bg-[#0066FF] hover:bg-[#005cbb] text-white font-inter font-medium flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#features" className="w-full sm:w-auto px-8 py-3.5 rounded-md border border-white/10 hover:bg-white/5 text-white font-inter font-medium flex items-center justify-center transition-colors">
            Explore Features
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 w-full max-w-2xl"
      >
        <div className="relative aspect-[4/3] rounded-xl border border-white/10 bg-[#1c1b1b] p-2 shadow-2xl overflow-hidden">
          {/* Mockup Header */}
          <div className="w-full h-8 border-b border-white/5 flex items-center px-4 gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
          </div>
          {/* Mockup Body */}
          <div className="flex h-full gap-4 px-2 pb-2">
            {/* Sidebar mock */}
            <div className="w-1/4 h-full bg-[#131313] rounded border border-white/5 flex flex-col gap-2 pt-4 px-2">
               <div className="w-3/4 h-3 bg-white/10 rounded" />
               <div className="w-1/2 h-3 bg-white/10 rounded" />
               <div className="w-2/3 h-3 bg-white/10 rounded" />
               <div className="mt-4 w-full h-2 bg-[#0066FF]/20 rounded" />
               <div className="w-3/4 h-2 bg-white/5 rounded" />
               <div className="w-1/2 h-2 bg-white/5 rounded" />
            </div>
            {/* Main content mock */}
            <div className="flex-1 flex flex-col gap-4">
               <div className="w-full h-1/2 bg-gradient-to-br from-[#2a2a2a] to-[#1c1b1b] rounded border border-white/5 p-4 flex flex-col justify-end">
                  <div className="w-1/3 h-4 bg-[#0066FF]/40 rounded mb-2" />
                  <div className="w-1/2 h-6 bg-white/20 rounded" />
               </div>
               <div className="flex gap-4 h-[30%]">
                  {/* Chart mock */}
                  <div className="w-1/2 h-full bg-[#201f1f] rounded border border-white/5 flex justify-center items-end p-2 gap-1 overflow-hidden">
                     {[40, 70, 30, 90, 50, 60].map((v, i) => (
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${v}%` }}
                        transition={{ duration: 1, delay: 0.5 + i*0.1 }}
                        key={i} className="flex-1 bg-[#abc7ff]/80 rounded-t" 
                       />
                     ))}
                  </div>
                  {/* Streak / profile mock */}
                  <div className="w-1/2 h-full bg-[#201f1f] rounded border border-white/5 p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Flame className="w-3 h-3 text-amber-400" />
                      </div>
                      <div className="w-12 h-2 bg-white/10 rounded" />
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5,6,7].map(d => (
                        <div key={d} className={`flex-1 h-2 rounded-full ${d <= 4 ? 'bg-emerald-500/40' : 'bg-white/5'}`} />
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
