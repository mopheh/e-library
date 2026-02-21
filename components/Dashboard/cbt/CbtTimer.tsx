"use client";
import { useEffect, useState } from "react";

interface CbtTimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
}

export default function CbtTimer({ durationMinutes, onTimeUp }: CbtTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    // Reset timer when duration prop changes (e.g. starting a new test)
    setTimeLeft(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(t - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="sticky font-rubik top-0 p-3 bg-zinc-100 border rounded-lg text-center font-normal dark:border-zinc-50 dark:text-zinc-50 dark:bg-slate-900 leading-none">
      <span className="text-xs uppercase text-zinc-500 mr-2">Time Left</span>
      <span className={`font-medium ${timeLeft < 60 ? "text-red-500" : ""}`}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
