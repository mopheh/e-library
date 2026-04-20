"use client";

import React from "react";
import { motion } from "framer-motion";

export const HowItWorks = () => {
  const steps = [
    { num: "01", title: "Find Your Course Materials", desc: "Easily search through structured faculty and department archives." },
    { num: "02", title: "Read and Track Progress", desc: "Dive into texts with automatic sync and visual progress tracking." },
    { num: "03", title: "Ask Questions Instantly", desc: "Highlight complex paragraphs and get instant, contextual AI explanations." },
    { num: "04", title: "Practice with Structured Assessments", desc: "Generate quizzes based exactly on what you've just read." },
    { num: "05", title: "Improve Academic Performance", desc: "Review your analytics and walk into exams with total confidence." },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-[#1c1b1b] border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c1b1b] via-[#131313] to-[#1c1b1b] opacity-50 -z-10" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16">
        <div className="md:w-1/3">
          <h2 className="font-manrope text-3xl md:text-4xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="font-inter text-[#c2c6d8] text-lg leading-relaxed">
            A seamless academic workflow designed to take you from discovery to mastery without leaving the platform.
          </p>
        </div>

        <div className="md:w-2/3 flex flex-col gap-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex gap-6 items-start"
            >
              <div className="font-manrope text-2xl font-bold text-[#abc7ff]/40">
                {step.num}
              </div>
              <div className="flex-1 pb-8 border-b border-white/5 relative">
                <h3 className="font-manrope text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="font-inter text-[#c2c6d8]">
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
