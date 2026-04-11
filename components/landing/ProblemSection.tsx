"use client";

import React from "react";
import { motion } from "framer-motion";
import { Files, LineChart, Stethoscope, SearchX } from "lucide-react";

export const ProblemSection = () => {
  const problems = [
    {
      icon: <Files className="w-6 h-6 text-[#ffb4ab]" />,
      title: "Scattered PDFs",
      desc: "Course materials are scattered across devices, emails, and random folders.",
    },
    {
      icon: <LineChart className="w-6 h-6 text-[#9ab3fd]" />,
      title: "No Progress Tracking",
      desc: "Impossible to know exactly how much of the syllabus you've actually covered.",
    },
    {
      icon: <Stethoscope className="w-6 h-6 text-[#ffb59d]" />,
      title: "Limited Exam Tools",
      desc: "Struggling to find relevant practice questions or simulate exam conditions.",
    },
    {
      icon: <SearchX className="w-6 h-6 text-[#c2c6d8]" />,
      title: "Hard Revision",
      desc: "Difficulty finding contextual explanations for complex academic concepts quickly.",
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
      <div className="text-center mb-16">
        <h2 className="font-manrope text-3xl md:text-4xl font-bold text-white mb-4">
          Studying Shouldn’t Feel Disorganized
        </h2>
        <p className="font-inter text-[#c2c6d8] max-w-2xl mx-auto text-lg">
          We understand the friction points that prevent academic excellence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {problems.map((prob, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-[#1c1b1b] border border-white/5 rounded-xl p-6 hover:bg-[#201f1f] transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] flex items-center justify-center mb-6">
              {prob.icon}
            </div>
            <h3 className="font-manrope text-xl font-semibold text-white mb-2">
              {prob.title}
            </h3>
            <p className="font-inter text-[#c2c6d8] text-sm leading-relaxed">
              {prob.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
