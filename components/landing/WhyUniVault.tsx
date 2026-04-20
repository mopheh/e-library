"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, GraduationCap, LayoutTemplate, Workflow } from "lucide-react";

export const WhyUniVault = () => {
  const reasons = [
    { title: "Structured Environment", desc: "No more chaotic folders. Everything is organized exactly how universities operate.", icon: <LayoutTemplate /> },
    { title: "Built for Universities", desc: "Designed with higher education faculties, departments, and grading in mind.", icon: <GraduationCap /> },
    { title: "Scalable and Secure", desc: "Enterprise-grade infrastructure ensures data safety and uptime for entire campuses.", icon: <ShieldCheck /> },
    { title: "Real Academic Workflows", desc: "Not just a PDF reader. It’s an end-to-end reading, tracking, and evaluation platform.", icon: <Workflow /> },
  ];

  return (
    <section id="institution" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="font-manrope text-3xl md:text-5xl font-bold text-white mb-6">
          Why UniVault?
        </h2>
        <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg">
          We bridge the gap between institutional requirements and student learning experiences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reasons.map((reason, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#abc7ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-[#131313] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#1c1b1b] border border-white/5 flex items-center justify-center text-[#abc7ff] mb-6">
                {reason.icon}
              </div>
              <h3 className="font-manrope text-lg font-bold text-white mb-3">
                {reason.title}
              </h3>
              <p className="font-inter text-sm text-[#c2c6d8] leading-relaxed">
                {reason.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
