"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Preloader = () => {
  const [isDone, setIsDone] = useState(false);
  const [flipPages, setFlipPages] = useState<number[]>([]);

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      setFlipPages((prev) => [...prev, count]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setTimeout(() => setIsDone(true), 1000);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  if (isDone) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f9f6f1] dark:bg-zinc-950 flex items-center justify-center">
      <div className="relative flex justify-center items-center w-32 h-32">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
        <div className="relative w-16 h-16 flex items-center justify-center">
          <img
            src="/rcf-logo.png"
            alt="Loading..."
            className="object-contain w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Preloader;
