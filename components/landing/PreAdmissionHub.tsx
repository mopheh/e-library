"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, MessageSquare, BookOpen } from "lucide-react";

export const PreAdmissionHub = () => {
  const features = [
    {
      title: "Practice Tests",
      desc: "Try timed practice exams with questions from real university courses. See your score instantly and learn exactly which areas need more attention.",
      icon: <Target className="w-6 h-6 text-[#abc7ff]" />,
      reverse: false,
    },
    {
      title: "Explore Departments",
      desc: "Peek inside your intended department. Browse real textbooks, course outlines, and materials so you know what to expect before you apply.",
      icon: <BookOpen className="w-6 h-6 text-[#abc7ff]" />,
      reverse: true,
    },
    {
      title: "Chat with Seniors",
      desc: "Connect with current students in your dream department. Ask them anything — about courses, workload, campus life — and get honest answers from people already there.",
      icon: <MessageSquare className="w-6 h-6 text-[#abc7ff]" />,
      reverse: false,
    },
    {
      title: "Study Roadmap",
      desc: "Follow a structured, step-by-step preparation roadmap tailored to your target department. Track progress, hit milestones, and build genuine readiness.",
      icon: <TrendingUp className="w-6 h-6 text-[#abc7ff]" />,
      reverse: true,
    },
  ];

  return (
    <section id="preadmission" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#abc7ff] rounded-full blur-[150px] opacity-10 -z-10" />

      <div className="text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-inter uppercase tracking-widest text-[#abc7ff] mb-6">
            Pre-Admission Hub
          </div>
          <h2 className="font-manrope text-4xl md:text-5xl font-bold text-white mb-6">
            Start Before You Enter
          </h2>
          <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg leading-relaxed">
            UniVault gives university aspirants real tools — practice tests, department previews, senior connections, and guided roadmaps — so you can start preparing before admission day.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col gap-32">
        {features.map((feature, idx) => (
          <div key={idx} className={`flex flex-col lg:flex-row items-center gap-16 ${feature.reverse ? "lg:flex-row-reverse" : ""}`}>
            
            <motion.div 
              initial={{ opacity: 0, x: feature.reverse ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex-1 flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] border border-white/5 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="font-manrope text-3xl md:text-3xl font-bold text-white mb-4">
                {feature.title}
              </h3>
              <p className="font-inter text-lg text-[#c2c6d8] leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex-1 w-full"
            >
              <div className="aspect-[4/3] rounded-xl bg-[#1c1b1b] border border-white/5 relative overflow-hidden shadow-2xl flex items-center justify-center group">
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="text-white/20 font-inter text-sm flex flex-col items-center gap-2 transition-transform group-hover:scale-105">
                  <div className="px-4 py-2 border border-white/10 bg-[#2a2a2a]/50 rounded-lg backdrop-blur-sm">
                    [ {feature.title} Preview ]
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        ))}
      </div>
    </section>
  );
};
