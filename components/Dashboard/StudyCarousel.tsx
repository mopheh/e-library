"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Brain, Zap } from "lucide-react";
import Image from "next/image";

const slides = [
  {
    id: 1,
    title: "Excel in Your Studies",
    description: "Personalized learning paths for you. Reach your academic goals faster with tailored insights.",
    icon: <Sparkles className="w-6 h-6 text-blue-400" />,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2000",
    cta: "Explore Features",
  },
  {
    id: 2,
    title: "New Materials Added",
    description: "Over 50+ new resources were added to your department library today. Stay ahead of the curve.",
    icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000",
    cta: "Go to Library",
  },
  {
    id: 3,
    title: "Boost Your Focus",
    description: "Our AI analysis suggests you are most productive between 8 AM and 11 AM. Plan accordingly!",
    icon: <Brain className="w-6 h-6 text-violet-400" />,
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=2000",
    cta: "View Insights",
  },
];

export default function StudyCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="relative w-full h-[320px] md:h-[350px] lg:h-[400px] overflow-hidden rounded-[3rem] shadow-xl group transition-all">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-zinc-950">
             <Image 
                src={slides[current].image} 
                alt={slides[current].title}
                fill
                className="object-cover opacity-60 brightness-[0.4] transition-all duration-1000 group-hover:scale-110"
                unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/20 to-transparent" />
          </div>

          <div className="relative z-10 h-full p-10 md:p-16 flex flex-col justify-center text-white max-w-2xl">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="bg-white/10 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10">
                 {slides[current].icon}
              </div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-200/80">
                Personalized for you
              </span>
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-5xl font-bold mb-5 tracking-tight leading-[1.1]"
            >
              {slides[current].title}
            </motion.h2>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-300 text-base md:text-lg mb-8 line-clamp-2 leading-relaxed"
            >
              {slides[current].description}
            </motion.p>
            
            <motion.button 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white text-zinc-950 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-blue-50 transition-all shadow-xl hover:shadow-blue-500/20 w-fit active:scale-95"
            >
              {slides[current].cta}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute bottom-10 left-16 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-700 rounded-full h-1.5 ${
              current === i ? "w-12 bg-white" : "w-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <div className="absolute bottom-10 right-16 flex gap-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={prev}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-2xl p-4 rounded-3xl text-white transition-all border border-white/10 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={next}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-2xl p-4 rounded-3xl text-white transition-all border border-white/10 active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
      </div>
    </div>
  );
}

