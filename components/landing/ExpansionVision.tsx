"use client";

import React from "react";
import { motion } from "framer-motion";
import { Map, BookOpen, UserCircle, University } from "lucide-react";

export const ExpansionVision = () => {
  const steps = [
    { title: "Aspirants", desc: "Gain initial exposure and prepare for admission with targeted resources.", icon: <Map className="w-6 h-6 text-[#abc7ff]" /> },
    { title: "Undergraduates", desc: "Navigate your degree using structured readings, AI assistance, and CBT tools.", icon: <UserCircle className="w-6 h-6 text-[#abc7ff]" /> },
    { title: "Departments", desc: "Manage faculty resources, structure syllabus content, and align academic standards.", icon: <BookOpen className="w-6 h-6 text-[#abc7ff]" /> },
    { title: "Institutions", desc: "Deploy campus-wide digital infrastructure with granular analytics and oversight.", icon: <University className="w-6 h-6 text-[#abc7ff]" /> },
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0066FF]/5 via-[#131313] to-[#131313]">
      <div className="text-center mb-16">
        <h2 className="font-manrope text-3xl md:text-5xl font-bold text-white mb-6">
          Built for the Entire Academic Lifecycle
        </h2>
        <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg leading-relaxed">
          UniVault isn&apos;t just an app; it&apos;s an evolving ecosystem designed to scale from the individual student to the highest levels of university administration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {/* Connector Line for Desktop */}
        <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="flex flex-col items-center text-center z-10"
          >
            <div className="w-20 h-20 rounded-full bg-[#1c1b1b] border-4 border-[#131313] shadow-[0_0_0_1px_rgba(255,255,255,0.05)] flex items-center justify-center mb-6 relative group">
               <div className="absolute inset-0 bg-[#0066FF] rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
               {step.icon}
            </div>
            <h3 className="font-manrope text-xl font-bold text-white mb-3">
              {step.title}
            </h3>
            <p className="font-inter text-sm text-[#c2c6d8] max-w-xs mx-auto leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
