"use client";

import React from "react";
import { motion } from "framer-motion";

export const HowItWorks = () => {
  const steps = [
    { num: "01", title: "Create Your Account", desc: "Sign up in seconds and tell us your university, faculty, department, and academic level. We'll personalize everything for you." },
    { num: "02", title: "Find Your Course Materials", desc: "Browse a well-organized library filtered by your department. Search for any topic and open materials instantly." },
    { num: "03", title: "Read with AI Help", desc: "Read your textbooks right inside UniVault. Stuck on something? Ask the AI tutor and get a clear explanation on the spot." },
    { num: "04", title: "Practice for Exams", desc: "Take timed practice tests based on what you've been reading. See your results right away and know what to focus on." },
    { num: "05", title: "Study Together", desc: "Join study rooms, chat with classmates, start course discussions, and ask seniors for advice — all in one place." },
    { num: "06", title: "Track Your Growth", desc: "Watch your streaks grow, check your stats, see where you rank, and discover scholarships and opportunities along the way." },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-[#1c1b1b] border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c1b1b] via-[#131313] to-[#1c1b1b] opacity-50 -z-10" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16">
        <div className="md:w-1/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-manrope text-3xl md:text-4xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="font-inter text-[#c2c6d8] text-lg leading-relaxed">
              A seamless academic workflow — from sign-up to academic mastery — without leaving the platform.
            </p>
          </motion.div>
        </div>

        <div className="md:w-2/3 flex flex-col gap-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="flex gap-6 items-start"
            >
              <div className="font-manrope text-2xl font-bold text-[#abc7ff]/40">
                {step.num}
              </div>
              <div className="flex-1 pb-8 border-b border-white/5 relative">
                <h3 className="font-manrope text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="font-inter text-[#c2c6d8] text-sm leading-relaxed">
                  {step.desc}
                </p>
                {/* Connecting Line */}
                {idx !== steps.length - 1 && (
                   <div className="absolute left-[-42px] top-10 bottom-[-24px] w-px bg-white/5" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
