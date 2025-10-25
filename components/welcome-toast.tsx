"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function WelcomeToast({ name }: { name: string | null | undefined }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Fire toast immediately when component mounts
    toast.custom(() => (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="p-5 font-poppins bg-background border rounded-lg shadow-md w-80"
      >
        <h3 className="font-semibold text-sm">
          👋 Welcome back{name ? `, ${name}` : ""}!
        </h3>
        <p className="text-xs text-muted-foreground">
          We’re glad to see you again — let’s continue learning!
        </p>
      </motion.div>
    ));

    // Simulate progress countdown
    let value = 100;
    const interval = setInterval(() => {
      value -= 2;
      if (value <= 0) clearInterval(interval);
      setProgress(value);
    }, 100);

    return () => clearInterval(interval);
  }, [name]);

  return null; // no visible JSX, Sonner handles rendering
}
