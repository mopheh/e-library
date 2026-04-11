"use client";

import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, BookOpen, Activity, LayoutDashboard, Building2 } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      title: "Smart Study Assistant",
      desc: "Ask questions while reading, get contextual explanations, and receive support for complex equations and structured formatting. Let our AI guide your understanding.",
      icon: <BrainCircuit className="w-6 h-6 text-[#abc7ff]" />,
      reverse: false,
    },
    {
      title: "Advanced Digital Library",
      desc: "Filter by faculty and department. Enjoy a modern search experience that instantly locates the structured academic resources you need.",
      icon: <BookOpen className="w-6 h-6 text-[#abc7ff]" />,
      reverse: true,
    },
    {
      title: "Reading Progress Tracking",
      desc: "Never lose your place again with page-level saving. Visualize your consistency with daily activity heatmaps and a personalized reading analytics dashboard.",
      icon: <Activity className="w-6 h-6 text-[#abc7ff]" />,
      reverse: false,
    },
    {
      title: "Practice & CBT Preparation",
      desc: "Generate practice questions on the fly, run self-contained exam simulations, and benefit from auto-graded assessments to solidify your knowledge.",
      icon: <LayoutDashboard className="w-6 h-6 text-[#abc7ff]" />,
      reverse: true,
    },
    {
      title: "Institutional Dashboard",
      desc: "Designed for universities: handle faculty and department management, monitor usage analytics, and utilize comprehensive academic oversight tools.",
      icon: <Building2 className="w-6 h-6 text-[#abc7ff]" />,
      reverse: false,
    },
  ];

  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
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
              <h2 className="font-manrope text-3xl md:text-4xl font-bold text-white mb-4">
                {feature.title}
              </h2>
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
                {/* Placeholder graphic for screenshot */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="text-white/20 font-inter text-sm flex flex-col items-center gap-2 transition-transform group-hover:scale-105">
                  <LayoutDashboard className="w-10 h-10 mb-2 opacity-50" />
                  [ {feature.title} Screenshot ]
                </div>
              </div>
            </motion.div>

          </div>
        ))}
      </div>
    </section>
  );
};
