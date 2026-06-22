"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

const cards = [
  {
    icon: <Target className="w-5 h-5" />,
    title: "Practice Tests",
    desc: "Try timed exams built from real university course materials. Understand where you stand before exams begin.",
    iconBg: "bg-blue-500/15 border-blue-500/25 text-blue-400",
    tag: "Pre-Admission Ready",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Explore Departments",
    desc: "Browse real course materials, outlines, and textbooks from your intended faculty — before you even apply.",
    iconBg: "bg-violet-500/15 border-violet-500/25 text-violet-400",
    tag: "Open Access",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Chat with Seniors",
    desc: "Connect directly with students in your target department. Ask about workload, courses, and campus reality.",
    iconBg: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
    tag: "Community-Powered",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Study Roadmap",
    desc: "Follow a structured, milestone-based preparation plan for your target department. Track every step of your journey.",
    iconBg: "bg-amber-500/15 border-amber-500/25 text-amber-400",
    tag: "Guided Path",
  },
];

export const PreAdmissionHub = () => {
  return (
    <section id="preadmission" className="relative py-32 px-6 md:px-12 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[#080810]">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/[0.06] rounded-full blur-3xl" />
        <div className="absolute left-0 top-1/3 w-[400px] h-[400px] bg-blue-500/[0.06] rounded-full blur-3xl" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/[0.08] mb-6">
            <span className="font-inter text-xs font-medium text-violet-300 uppercase tracking-widest">For Aspirants</span>
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Your academic journey
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] to-[#60a5fa]">
              starts before day one.
            </span>
          </h2>
          <p className="font-inter text-[#636e8a] max-w-xl mx-auto text-lg leading-relaxed">
            Whether you&apos;re awaiting admission or just curious — explore your dream department, practice real exam questions, and connect with students who&apos;ve already walked the path.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-[#0f0f16] p-7 hover:border-white/[0.12] transition-all duration-400 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/[0.02] to-transparent transition-opacity duration-500 rounded-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl border ${card.iconBg} flex items-center justify-center`}>
                    {card.icon}
                  </div>
                  <span className="font-inter text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-full bg-white/[0.02]">
                    {card.tag}
                  </span>
                </div>
                <h3 className="font-manrope text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="font-inter text-sm text-[#636e8a] leading-relaxed group-hover:text-[#8892b0] transition-colors">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-violet-500/10 p-10 text-center overflow-hidden"
        >
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl" />
          <div className="relative">
            <h3 className="font-manrope text-2xl md:text-3xl font-bold text-white mb-3">
              Not a student yet? That&apos;s okay.
            </h3>
            <p className="font-inter text-[#636e8a] mb-8 max-w-md mx-auto">
              Start exploring now — browse departments, take practice tests, and connect with the community before you even receive your admission letter.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0a0a0f] font-inter font-semibold text-sm hover:bg-white/90 transition-all hover:scale-[1.02]">
                  Explore as Aspirant
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0a0a0f] font-inter font-semibold text-sm hover:bg-white/90 transition-all hover:scale-[1.02]"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </SignedIn>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
