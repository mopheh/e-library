"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const HeroSection = () => {
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
          Institutional Sophistication
        </div>
        <h1 className="font-manrope text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Your Complete Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#abc7ff] to-[#0066FF]">Study Hub</span>
        </h1>
        <p className="font-inter text-lg text-[#c2c6d8] leading-relaxed mb-10 max-w-2xl">
          From admission preparation to graduation, UniVault supports your entire academic journey in one structured platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto px-8 py-3.5 rounded-md bg-[#0066FF] hover:bg-[#005cbb] text-white font-inter font-medium flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#features" className="w-full sm:w-auto px-8 py-3.5 rounded-md border border-white/10 hover:bg-white/5 text-white font-inter font-medium flex items-center justify-center transition-colors">
            Explore the Library
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
            <div className="w-1/4 h-full bg-[#131313] rounded border border-white/5 flex flex-col gap-2 pt-4 px-2">
               <div className="w-3/4 h-3 bg-white/10 rounded" />
               <div className="w-1/2 h-3 bg-white/10 rounded" />
               <div className="w-2/3 h-3 bg-white/10 rounded" />
            </div>
            <div className="flex-1 flex flex-col gap-4">
               <div className="w-full h-1/2 bg-gradient-to-br from-[#2a2a2a] to-[#1c1b1b] rounded border border-white/5 p-4 flex flex-col justify-end">
                  <div className="w-1/3 h-4 bg-[#0066FF]/40 rounded mb-2" />
                  <div className="w-1/2 h-6 bg-white/20 rounded" />
               </div>
               <div className="flex gap-4 h-[30%]">
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
                  <div className="w-1/2 h-full bg-[#201f1f] rounded border border-white/5 p-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 mb-2" />
                    <div className="w-full h-2 bg-white/10 rounded" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
