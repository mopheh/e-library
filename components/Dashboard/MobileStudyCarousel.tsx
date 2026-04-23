"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "Excel in Your Studies",
    description: "Personalized learning paths for you.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1600",
    cta: "Explore Features",
  },
  {
    id: 2,
    title: "Unlock Premium Materials",
    description: "Get access to exclusive textbooks.",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1600",
    cta: "View Library",
  },
  {
    id: 3,
    title: "Join Study Groups",
    description: "Collaborate with peers worldwide.",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1600",
    cta: "Find Groups",
  }
];

export default function MobileStudyCarousel() {
  const [current, setCurrent] = useState(0);

  // Auto-play could be added if needed, sticking to static/dots for exact match
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full h-[180px] rounded-[24px] overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-zinc-900">
              <Image 
                src={slides[current].image} 
                alt={slides[current].title}
                fill
                className="object-cover opacity-70"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content overlay */}
            <div className="relative z-10 h-full p-6 flex flex-col justify-center text-white">
              <span className="text-xs font-medium text-white/80 mb-1.5 font-poppins">
                {slides[current].description}
              </span>
              <h2 className="text-[22px] font-bold mb-4 font-poppins leading-tight tracking-tight shadow-sm">
                {slides[current].title}
              </h2>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-4 py-1.5 rounded-full font-semibold text-xs transition-all w-max shadow-sm">
                {slides[current].cta}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              current === i ? "w-6 bg-blue-600" : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
