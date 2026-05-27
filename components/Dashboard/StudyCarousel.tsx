"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    tag: "Academic Intelligence",
    title: "Your Personal\nLearning Engine",
    description:
      "Adaptive paths built around your pace, courses, and goals — not everyone else's.",
    cta: { label: "Explore Features", href: "/dashboard/ai" },
    icon: Sparkles,
    accent: "#6366f1",
    bg: "from-[#0f0c29] via-[#1a1650] to-[#24243e]",
    overlay: "from-indigo-950/90 via-indigo-900/40 to-transparent",
  },
  {
    id: 2,
    tag: "Department Library",
    title: "Materials Added\nThis Week",
    description:
      "Fresh textbooks, past questions and lecture notes — curated for your semester.",
    cta: { label: "Browse Library", href: "/library" },
    icon: BookOpen,
    accent: "#10b981",
    bg: "from-[#0b2027] via-[#0d3b30] to-[#0b2027]",
    overlay: "from-emerald-950/90 via-emerald-900/40 to-transparent",
  },
  {
    id: 3,
    tag: "AI-Powered Study",
    title: "Peak Hours,\nPeak Performance",
    description:
      "Our AI detects when you learn best. Block that time and watch your scores climb.",
    cta: { label: "View Insights", href: "/dashboard/ai" },
    icon: Brain,
    accent: "#a855f7",
    bg: "from-[#1a0533] via-[#2d1060] to-[#1a0533]",
    overlay: "from-purple-950/90 via-purple-900/40 to-transparent",
  },
];

export default function StudyCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [paused]);

  const next = () => setCurrent((p) => (p + 1) % slides.length);
  const prev = () => setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1));

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div
      className={`relative w-full h-[280px] md:h-[340px] lg:h-[380px] rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${slide.bg} transition-all duration-700`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Animated glow orb */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.35, scale: 1.1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: slide.accent }}
      />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: slide.accent }} />

      {/* Grid texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12"
        >
          {/* Tag */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${slide.accent}30`, border: `1px solid ${slide.accent}40` }}>
              <Icon className="w-3.5 h-3.5" style={{ color: slide.accent }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 font-cabin">
              {slide.tag}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-4xl font-black font-cabin uppercase tracking-tighter text-white leading-[1.05] mb-3 whitespace-pre-line">
            {slide.title}
          </h2>

          {/* Desc */}
          <p className="text-xs md:text-sm text-white/55 font-poppins leading-relaxed max-w-md mb-6 line-clamp-2">
            {slide.description}
          </p>

          {/* CTA */}
          <Link
            href={slide.cta.href}
            className="flex items-center gap-2 w-fit px-5 py-2.5 rounded-2xl text-[11px] font-black font-cabin uppercase tracking-widest text-white transition-all hover:gap-3 active:scale-95"
            style={{ background: `${slide.accent}25`, border: `1px solid ${slide.accent}40`, backdropFilter: "blur(12px)" }}
          >
            {slide.cta.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3">
        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-500 rounded-full h-1"
              style={{
                width: i === current ? 24 : 6,
                background: i === current ? slide.accent : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        {/* Arrow buttons */}
        <button onClick={prev} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all active:scale-90">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={next} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all active:scale-90">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
