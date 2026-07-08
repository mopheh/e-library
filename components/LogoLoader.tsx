"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const MOTTO_PHRASES = ["We Worship", "We Reign", "We Excel"];

export const LogoLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col items-center justify-center gap-8 animate-fade-in">
      {/* Spinner + Logo */}
      <div className="relative flex justify-center items-center w-24 h-24">
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 animate-spin" />

        {/* Center Logo */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <Image
            src="/rcf-logo.png"
            alt="Loading RCF..."
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Motto */}
      <div className="flex items-center gap-2">
        {MOTTO_PHRASES.map((phrase, i) => (
          <span key={phrase} className="flex items-center gap-2">
            <motion.span
              className="text-[10px] font-poppins font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3 + i * 0.25,
                duration: 0.45,
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
                transition={{ delay: 0.3 + i * 0.25 + 0.18, duration: 0.3 }}
              >
                ·
              </motion.span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};
