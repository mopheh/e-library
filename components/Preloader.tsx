"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBookOpen } from "react-icons/fi";

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
    <div className="fixed inset-0 z-[9999] bg-[#f9f6f1] flex items-center justify-center">
      {/* Spinner Ring */}
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-b-[#5C4033]/30 border-t-[#8B5E3C] border-l-transparent border-r-transparent" />

        {/* Book Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-20 h-24">
            {/* Back Cover */}
            <div className="absolute inset-0 bg-[#5C4033] rounded-md shadow-inner z-0" />

            {/* Animated Pages */}
            <AnimatePresence>
              {flipPages.map((i) => (
                <motion.div
                  key={i}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: -180 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-white rounded-md shadow origin-left"
                  style={{
                    zIndex: 100 - i,
                    transformStyle: "preserve-3d",
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Front Cover */}
            <div className="absolute inset-0 border border-[#3B2F2F] rounded-md z-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
