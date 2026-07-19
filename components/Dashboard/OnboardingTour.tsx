"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import {
  BarChart2,
  BookOpen,
  ChevronRight,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Map,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const TOUR_KEY = "rcf-dashboard-tour-done";
const CARD_W = 340;
const CARD_W_MOBILE_MAX = 300; // max width; actual width is fluid (100vw - 32px)
const CARD_H_EST = 270; // conservative estimated card height
const GAP = 14;         // gap between spotlight edge and card
const SCREEN_MARGIN = 12;

// ── Types ────────────────────────────────────────────────────────────────────

interface TourStep {
  target: string | null;
  icon: React.ReactNode;
  title: string;
  body: string;
  padding?: number;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ── Step definitions ─────────────────────────────────────────────────────────

const DESKTOP_STEPS: TourStep[] = [
  {
    target: null,
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Welcome to your Dashboard!",
    body: "You're now part of the Bethel community. Let's take a quick tour so you can get the most out of your learning hub.",
  },
  {
    target: "kpi-cards",
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Your Stats at a Glance",
    body: "These cards track books you've read, total study time, your daily streak, and days remaining to your exam.",
    padding: 10,
  },
  {
    target: "study-carousel",
    icon: <BookOpen className="w-5 h-5" />,
    title: "Study Materials",
    body: "Browse and open resources curated specifically for your department and level. New materials are added regularly.",
    padding: 10,
  },
  {
    target: "streak-tracker",
    icon: <Flame className="w-5 h-5" />,
    title: "Your Study Streak",
    body: "Consistency is everything. Your streak increments every day you open at least one material. Don't break the chain!",
    padding: 10,
  },
  {
    target: "quick-actions",
    icon: <Zap className="w-5 h-5" />,
    title: "Quick Actions",
    body: "Jump straight to the Library, CBT practice, AI Assistant, or request a resource — all in one click.",
    padding: 10,
  },
  {
    target: "learning-chart",
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Learning Activity",
    body: "See your reading activity visualised over the last 7 days. Use this to spot patterns and optimise your study schedule.",
    padding: 10,
  },
  {
    target: "sidebar-nav",
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: "Navigation Sidebar",
    body: "Access every section of the platform from here — Academics (Library, CBT), Community (Leaderboard, Ask Seniors), and more.",
    padding: 6,
  },
  {
    target: null,
    icon: <Sparkles className="w-6 h-6" />,
    title: "You're all set! 🎓",
    body: "Explore your dashboard, start a study session, or try the AI Assistant. The whole platform is at your fingertips.",
  },
];

const MOBILE_STEPS: TourStep[] = [
  {
    target: null,
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Welcome to your Dashboard!",
    body: "You're now part of the Bethel community. Here's a quick tour of your learning hub.",
  },
  {
    target: "mobile-carousel",
    icon: <BookOpen className="w-5 h-5" />,
    title: "Study Materials",
    body: "Swipe through resources curated for your department and level right here.",
    padding: 10,
  },
  {
    target: "mobile-kpi",
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Your Stats",
    body: "Track your books read, study hours, daily streak, and AI usage at a glance.",
    padding: 10,
  },
  {
    target: "mobile-quick-actions",
    icon: <Zap className="w-5 h-5" />,
    title: "Quick Access",
    body: "Tap any shortcut to jump straight into the Library, CBT, AI Assistant, or resource requests.",
    padding: 10,
  },
  {
    target: "mobile-streak",
    icon: <Flame className="w-5 h-5" />,
    title: "Study Streak",
    body: "Keep your streak alive every day. Consistency is the key to academic excellence!",
    padding: 10,
  },
  {
    target: null,
    icon: <Map className="w-6 h-6" />,
    title: "Explore More",
    body: "Use the bottom navigation bar to access the Library, CBT practice, Messages, and your Profile anytime.",
  },
  {
    target: null,
    icon: <Sparkles className="w-6 h-6" />,
    title: "You're all set! 🎓",
    body: "Everything you need is right here. Happy studying!",
  },
];

// ── Animation variants ───────────────────────────────────────────────────────

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.96, y: -6, transition: { duration: 0.18 } },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function measureTarget(target: string, padding: number = 10): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - padding,
    left: r.left - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

/**
 * Compute the pixel position for the tooltip card relative to the spotlight rect.
 * Returns { top, left, arrowSide } where arrowSide is "top" | "bottom" | null.
 */
function computeCardPosition(
  spotRect: Rect,
  cardW: number,
  vw: number,
  vh: number
): { top: number; left: number; arrowSide: "top" | "bottom" } {
  const spaceBelow = vh - (spotRect.top + spotRect.height);
  const spaceAbove = spotRect.top;

  let top: number;
  let arrowSide: "top" | "bottom";

  if (spaceBelow >= CARD_H_EST + GAP) {
    // Place BELOW the spotlight
    top = spotRect.top + spotRect.height + GAP;
    arrowSide = "top"; // arrow points upward toward element
  } else if (spaceAbove >= CARD_H_EST + GAP) {
    // Place ABOVE the spotlight
    top = spotRect.top - GAP - CARD_H_EST;
    arrowSide = "bottom"; // arrow points downward toward element
  } else {
    // Not enough space; place below but allow it to scroll into view
    top = Math.max(SCREEN_MARGIN, spotRect.top + spotRect.height + GAP);
    arrowSide = "top";
  }

  // Clamp to viewport vertically
  top = Math.max(SCREEN_MARGIN, Math.min(top, vh - CARD_H_EST - SCREEN_MARGIN));

  // Center horizontally on the element, then clamp to viewport
  const elCenterX = spotRect.left + spotRect.width / 2;
  let left = elCenterX - cardW / 2;
  left = Math.max(SCREEN_MARGIN, Math.min(left, vw - cardW - SCREEN_MARGIN));

  return { top, left, arrowSide };
}

// ── Spotlight ─────────────────────────────────────────────────────────────────
// Renders a rounded rect that reveals the target element through the dark overlay.
// The dark overlay is drawn as a full-screen SVG mask so it reliably covers 100vw×100vh.

interface SpotlightOverlayProps {
  rect: Rect | null;
  onClick: () => void;
}

const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({ rect, onClick }) => {
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!vw || !vh) return null;

  // When no spotlight target: solid full-screen dark overlay
  if (!rect) {
    return (
      <motion.div
        key="solid-backdrop"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[109] cursor-pointer"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={onClick}
      />
    );
  }

  // When spotlight target: SVG with a rounded-rect cutout
  const r = 14; // border-radius of spotlight hole
  const { top, left, width, height } = rect;

  return (
    <motion.svg
      key="svg-backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[109] cursor-pointer"
      width={vw}
      height={vh}
      viewBox={`0 0 ${vw} ${vh}`}
      onClick={onClick}
      style={{ pointerEvents: "all" }}
    >
      <defs>
        <mask id="tour-mask">
          {/* White = visible (dark overlay shows) */}
          <rect width={vw} height={vh} fill="white" />
          {/* Black = transparent cutout (spotlight hole) */}
          <motion.rect
            animate={{
              x: left,
              y: top,
              width,
              height,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            rx={r}
            ry={r}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(0,0,0,0.75)"
        mask="url(#tour-mask)"
      />
    </motion.svg>
  );
};

// ── Tooltip Card ─────────────────────────────────────────────────────────────

interface CardProps {
  step: TourStep;
  stepIndex: number;
  total: number;
  spotRect: Rect | null;
  isMobile: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const TooltipCard: React.FC<CardProps> = ({
  step, stepIndex, total, spotRect, isMobile,
  onNext, onBack, onSkip, isFirst, isLast,
}) => {
  // Track viewport dimensions so position recalculates on resize
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));
  const [vh, setVh] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 800));

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // On mobile use fluid width: min(100vw - 32px, CARD_W_MOBILE_MAX)
  const cardW = isMobile ? Math.min(vw - 32, CARD_W_MOBILE_MAX) : CARD_W;

  let posStyle: React.CSSProperties;
  let arrowSide: "top" | "bottom" | null = null;

  if (!spotRect) {
    // Center modal for welcome/finish steps — pure CSS so it adapts to any screen
    posStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: isMobile ? `min(${CARD_W_MOBILE_MAX}px, calc(100vw - 32px))` : cardW,
      maxWidth: `calc(100vw - ${SCREEN_MARGIN * 2}px)`,
    };
  } else {
    const { top, left, arrowSide: side } = computeCardPosition(spotRect, cardW, vw, vh);
    arrowSide = side;
    posStyle = {
      position: "fixed",
      top,
      left: Math.max(SCREEN_MARGIN, Math.min(left, vw - cardW - SCREEN_MARGIN)),
      width: cardW,
      maxWidth: `calc(100vw - ${SCREEN_MARGIN * 2}px)`,
    };
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ ...posStyle, zIndex: 120 }}
        className="font-poppins"
      >
        {/* Arrow pointing TOWARD the spotlight element */}
        {arrowSide === "top" && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-[7px] w-3.5 h-3.5 rotate-45 bg-white dark:bg-zinc-900 border-l border-t border-zinc-100 dark:border-zinc-800"
            style={{ zIndex: 1 }}
          />
        )}

        {/* Card body — overflow-hidden separate from the arrow */}
        <div
          className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
          style={{ zIndex: 2 }}
        >
          {/* Gradient accent strip */}
          <div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500" />

          <div className="p-5 flex flex-col gap-3.5">
            {/* Icon row + counter */}
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {step.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-cabin">
                {stepIndex + 1} / {total}
              </span>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === stepIndex
                      ? "w-5 h-[5px] bg-blue-500"
                      : i < stepIndex
                      ? "w-[5px] h-[5px] bg-blue-300 dark:bg-blue-700"
                      : "w-[5px] h-[5px] bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              ))}
            </div>

            {/* Text */}
            <div>
              <h3 className="text-sm font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
                {step.title}
              </h3>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {step.body}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={onSkip}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {isLast ? "Close" : "Skip tour"}
              </button>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={onBack}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold font-cabin text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-[11px] font-bold font-cabin shadow-md shadow-blue-200/40 dark:shadow-none transition-all active:scale-95"
                >
                  {isLast ? (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow pointing AWAY from the spotlight element (card is ABOVE element) */}
        {arrowSide === "bottom" && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3.5 h-3.5 rotate-45 bg-white dark:bg-zinc-900 border-r border-b border-zinc-100 dark:border-zinc-800"
            style={{ zIndex: 1 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────

interface OnboardingTourProps {
  isMobile?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isMobile = false,
}) => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotRect, setSpotRect] = useState<Rect | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;
  const currentStep = steps[stepIndex];

  // ── Initialise: show once ───────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (localStorage.getItem(TOUR_KEY) !== "1") setActive(true);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // ── Measure the current step's target ──────────────────────────
  const measureCurrent = useCallback(() => {
    if (!currentStep.target) { setSpotRect(null); return; }
    const r = measureTarget(currentStep.target, currentStep.padding);
    setSpotRect(r);
  }, [currentStep]);

  // ── Scroll target into view, then measure ──────────────────────
  const scrollAndMeasure = useCallback(() => {
    const { target, padding } = currentStep;
    if (!target) { setSpotRect(null); return; }

    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!el) { setSpotRect(null); return; }

    // Scroll the element to centre of viewport
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Re-measure after scroll settles (~400 ms)
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const r = measureTarget(target, padding);
      setSpotRect(r);
    }, 420);
  }, [currentStep]);

  // ── Fire scroll+measure on every step change ───────────────────
  useEffect(() => {
    if (!active) return;
    scrollAndMeasure();
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [active, stepIndex, scrollAndMeasure]);

  // ── Keep spotlight aligned on window scroll / resize ───────────
  useEffect(() => {
    if (!active || !currentStep.target) return;
    const onScroll = () => measureCurrent();
    const onResize = () => measureCurrent();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [active, currentStep.target, measureCurrent]);

  // ── Handlers ────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setActive(false);
    setSpotRect(null);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex === steps.length - 1) dismiss();
    else setStepIndex((i) => i + 1);
  }, [stepIndex, steps.length, dismiss]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Full-screen overlay with spotlight cutout */}
          <SpotlightOverlay rect={spotRect} onClick={dismiss} />

          {/* Close (X) button */}
          <motion.button
            key="tour-close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.35 } }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            aria-label="Close tour"
            className="fixed z-[130] w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition-colors border border-white/10"
            style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))", right: "max(1rem, env(safe-area-inset-right, 1rem))" }}
          >
            <X className="w-4 h-4" />
          </motion.button>

          {/* Tooltip card */}
          <TooltipCard
            step={currentStep}
            stepIndex={stepIndex}
            total={steps.length}
            spotRect={spotRect}
            isMobile={isMobile}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={dismiss}
            isFirst={stepIndex === 0}
            isLast={stepIndex === steps.length - 1}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
