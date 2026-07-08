"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOTTO_PHRASES = ["We Worship", "We Reign", "We Excel"];

const Preloader = () => {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsDone(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[9999] bg-[#f9f6f1] dark:bg-zinc-950 flex flex-col items-center justify-center gap-10"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Spinner + Logo */}
          <motion.div
            className="relative flex justify-center items-center w-32 h-32"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
            <div className="relative w-16 h-16 flex items-center justify-center">
              <img
                src="/rcf-logo.png"
                alt="Loading..."
                className="object-contain w-full h-full"
              />
            </div>
          </motion.div>

          {/* Motto */}
          <div className="flex items-center gap-2">
            {MOTTO_PHRASES.map((phrase, i) => (
              <span key={phrase} className="flex items-center gap-2">
                <motion.span
                  className="text-[11px] font-poppins font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.5 + i * 0.28,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                >
                  {phrase}
                </motion.span>
                {i < MOTTO_PHRASES.length - 1 && (
                  <motion.span
                    className="text-zinc-300 dark:text-zinc-700 text-xs select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.28 + 0.2, duration: 0.3 }}
                  >
                    ·
                  </motion.span>
                )}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
