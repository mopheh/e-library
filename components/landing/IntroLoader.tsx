"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import Image from "next/image";

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "rcf-intro-seen";

// Cinematic stage sequence
// 0 → logo reveal        (~0 ms)
// 1 → tagline appears    (~1 000 ms)
// 2 → grid + orbs pulse  (~1 800 ms)
// 3 → exit               (~3 400 ms)
type Stage = 0 | 1 | 2 | 3;

const STAGE_TIMES: Record<Stage, number> = {
  0: 0,
  1: 1800,
  2: 3200,
  3: 6000,
};

// Colour palette  ─ zinc / grey monochrome
const C = {
  light: "#d4d4d8",   // zinc-300
  mid:   "#a1a1aa",   // zinc-400
  muted: "#71717a",   // zinc-500
};

const GRADIENT = `linear-gradient(135deg, ${C.light}, ${C.mid}, ${C.muted})`;
const GRADIENT_TEXT = `linear-gradient(to right, ${C.light}, ${C.mid}, ${C.muted})`;

// ── Shared Framer variants ───────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: "easeOut", delay: d },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.72, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "easeOut", delay: i * 0.07 },
  }),
};

// ── Sub-components ───────────────────────────────────────────────────────────

/** Ambient orb that pulses gently */
const Orb = ({
  color,
  size,
  x,
  y,
  blur,
  opacity,
  delay = 0,
}: {
  color: string;
  size: number;
  x: string;
  y: string;
  blur: number;
  opacity: number;
  delay?: number;
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      background: color,
      width: size,
      height: size,
      left: x,
      top: y,
      filter: `blur(${blur}px)`,
    }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: [0, opacity, opacity * 0.85, opacity],
      scale: [0.8, 1, 1.04, 1],
    }}
    transition={{
      duration: 4.5,
      delay,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
    }}
  />
);

/** Animated dot-grid background — subtle dark pattern */
const DotGrid = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2, delay: 0.4 }}
    style={{
      backgroundImage:
        "radial-gradient(circle, rgba(161,161,170,0.13) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
    }}
  />
);

/** Top-left + bottom-right corner accent lines */
const CornerLines = () => (
  <>
    {/* Top-left */}
    <motion.div
      className="absolute top-6 left-6 pointer-events-none"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
    >
      <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-zinc-400/50 to-transparent mb-1.5" />
      <div className="h-10 w-[1px] bg-gradient-to-b from-zinc-400/50 to-transparent" />
    </motion.div>
    {/* Bottom-right */}
    <motion.div
      className="absolute bottom-6 right-6 pointer-events-none flex flex-col items-end"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
    >
      <div className="w-10 h-[1px] bg-gradient-to-l from-transparent via-zinc-400/50 to-transparent mb-1.5" />
      <div className="h-10 w-[1px] bg-gradient-to-t from-zinc-400/50 to-transparent ml-auto" />
    </motion.div>
  </>
);

/** Thin horizontal scan-line that sweeps top→bottom once */
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-[1px] pointer-events-none"
    style={{
      background:
        "linear-gradient(to right, transparent, rgba(161,161,170,0.35), transparent)",
    }}
    initial={{ top: "-2%", opacity: 0 }}
    animate={{ top: "102%", opacity: [0, 0.9, 0] }}
    transition={{ duration: 1.8, delay: 0.6, ease: "linear" }}
  />
);

/** Tagline with per-word stagger */
const Tagline = () => {
  const words = ["Learn.", "Grow.", "Excel."];
  return (
    <div className="flex items-center gap-3">
      {words.map((w, i) => (
        <motion.span
          key={w}
          custom={i}
          variants={letterVariants}
          initial="hidden"
          animate="visible"
          className="text-[11px] font-bold uppercase tracking-[0.22em] font-cabin"
          style={{
            backgroundImage: GRADIENT_TEXT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {w}
        </motion.span>
      ))}
    </div>
  );
};

/** Thin loading bar beneath content */
const ProgressBar = ({ duration }: { duration: number }) => (
  <motion.div
    className="w-28 h-[2px] rounded-full overflow-hidden"
    style={{ background: "rgba(255,255,255,0.07)" }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8, duration: 0.4 }}
  >
    <motion.div
      className="h-full rounded-full"
      style={{ backgroundImage: GRADIENT }}
      initial={{ width: "0%" }}
      animate={{ width: "100%" }}
      transition={{ duration, ease: "linear", delay: 0.8 }}
    />
  </motion.div>
);

/** Floating badge — small "v2.0" / "Premium" pill */
const Badge = () => (
  <motion.div
    className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest font-cabin"
    style={{
      background: "rgba(113,113,122,0.10)",
      borderColor: "rgba(161,161,170,0.22)",
      color: "rgba(212,212,216,0.85)",
    }}
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.45, ease: "easeOut" }}
  >
    <span
      className="w-1.5 h-1.5 rounded-full animate-pulse"
      style={{ background: C.mid }}
    />
    Academic Platform
  </motion.div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const IntroLoader = () => {
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState<Stage>(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const alreadySeen = localStorage.getItem(STORAGE_KEY) === "1";

    if (reduceMotion || alreadySeen) {
      setVisible(false);
      return;
    }

    // Queue each stage transition
    (Object.entries(STAGE_TIMES) as [string, number][]).forEach(
      ([stageStr, delay]) => {
        const s = parseInt(stageStr) as Stage;
        if (s === 0) return; // already in stage 0
        const t = setTimeout(() => setStage(s), delay);
        timersRef.current.push(t);
      }
    );

    // Close
    const closeTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
    }, 7500);
    timersRef.current.push(closeTimer);

    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // Lock scroll while visible
  useEffect(() => {
    if (!visible) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ background: "#111113" }}
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)", scale: 1.03 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
        >
          {/* ── Ambient orbs ───────────────────────────────── */}
          <Orb color={C.light} size={560} x="-10%" y="-15%" blur={110} opacity={0.07} delay={0}   />
          <Orb color={C.mid}   size={480} x="55%"  y="40%"  blur={130} opacity={0.06} delay={0.6} />
          <Orb color={C.muted} size={360} x="20%"  y="55%"  blur={100} opacity={0.05} delay={1.2} />

          {/* ── Dot grid ───────────────────────────────────── */}
          <DotGrid />

          {/* ── Corner accents ─────────────────────────────── */}
          <CornerLines />

          {/* ── Scan line ──────────────────────────────────── */}
          <ScanLine />

          {/* ── Core content ───────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center gap-5">

            {/* Badge */}
            <AnimatePresence>
              {stage >= 1 && <Badge key="badge" />}
            </AnimatePresence>

            {/* Logo mark */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              {/* Glowing ring behind logo */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: GRADIENT,
                  filter: "blur(22px)",
                  opacity: 0.18,
                }}
                animate={{ opacity: [0.22, 0.38, 0.22] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Logo container */}
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(113,113,122,0.12), rgba(82,82,91,0.07))",
                  borderColor: "rgba(161,161,170,0.22)",
                  boxShadow:
                    "0 0 0 1px rgba(113,113,122,0.12), 0 16px 48px rgba(0,0,0,0.5)",
                }}
              >
                <Image
                  src="/rcf-logo.png"
                  alt="Bethel"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* Wordmark */}
            <motion.div variants={fadeUp} custom={0.1} initial="hidden" animate="visible">
              <p
                className="text-4xl md:text-5xl font-black font-cabin tracking-tighter leading-none"
                style={{
                  backgroundImage: "linear-gradient(to bottom, #ffffff 40%, rgba(255,255,255,0.45))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Bethel
              </p>
            </motion.div>

            {/* Tagline words — staggered */}
            <AnimatePresence>
              {stage >= 1 && <Tagline key="tagline" />}
            </AnimatePresence>

            {/* Separator line */}
            <AnimatePresence>
              {stage >= 2 && (
                <motion.div
                  key="sep"
                  className="w-px h-6"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(161,161,170,0.4), transparent)",
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            {/* Sub-copy */}
            <AnimatePresence>
              {stage >= 2 && (
                <motion.p
                  key="sub"
                  variants={fadeUp}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                  className="text-[11px] font-poppins text-center max-w-[200px] leading-relaxed"
                  style={{ color: "rgba(148,163,184,0.75)" }}
                >
                  Your complete academic ecosystem
                </motion.p>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <ProgressBar duration={6.5} />

            {/* Skip hint */}
            <motion.p
              className="text-[9px] font-poppins"
              style={{ color: "rgba(100,116,139,0.5)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              Click anywhere to skip
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
