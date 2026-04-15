"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, GraduationCap, Zap } from "lucide-react";
import Image from "next/image";

const slides = [
  {
    id: 1,
    title: "Excel in Your Studies",
    description: "Personalized learning paths tailored just for you. Reach your academic goals faster.",
    icon: <Sparkles className="w-6 h-6 text-blue-400" />,
    image: "https://images.unsplash.com/photo-1454165833767-02a6d40082d7?auto=format&fit=crop&q=80&w=2000",
    cta: "Explore Features",
  },
  {
    id: 2,
    title: "New Materials Added",
    description: "Over 50+ new resources were added to your department library today. Check them out!",
    icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000",
    cta: "Go to Library",
  },
  {
    id: 3,
    title: "Keep the Streak Alive",
    description: "You're on a 3-day study streak! Consistent learners are 4x more likely to pass.",
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2000",
    cta: "View Stats",
  },
];

export default function StudyCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="relative w-full h-64 sm:h-72 lg:h-80 overflow-hidden rounded-[2.5rem] shadow-2xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image with Low-Brightness Overlay */}
          <div className="absolute inset-0 bg-zinc-900">
             <Image 
                src={slides[current].image} 
                alt={slides[current].title}
                fill
                className="object-cover opacity-60 brightness-[0.4]"
                unoptimized
             />
             <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 h-full p-8 sm:p-12 flex flex-col justify-center text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                 {slides[current].icon}
              </div>
              <span className="text-sm font-medium tracking-wide uppercase opacity-90">
                Personalized for you
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 font-open-sans tracking-tight">
              {slides[current].title}
            </h2>
            
            <p className="text-blue-50/80 text-sm sm:text-base mb-6 line-clamp-2 leading-relaxed">
              {slides[current].description}
            </p>
            
            <button className="bg-white text-zinc-900 px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-lg w-fit">
              {slides[current].cta}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-12 flex gap-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-500 rounded-full h-1.5 ${
              current === i ? "w-10 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <div className="absolute bottom-8 right-12 flex gap-2 z-20">
          <button 
            onClick={prev}
            className="bg-white/5 hover:bg-white/20 backdrop-blur-xl p-3 rounded-2xl text-white transition-all border border-white/10 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={next}
            className="bg-white/5 hover:bg-white/20 backdrop-blur-xl p-3 rounded-2xl text-white transition-all border border-white/10 active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
      </div>
    </div>
  );
}
