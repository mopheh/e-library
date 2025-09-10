"use client";
import { useEffect, useState } from "react";

export default function CbtTimer() {
  const [timeLeft, setTimeLeft] = useState(60 * 30); // 30 mins

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(t - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="sticky font-rubik top-0 p-3 bg-gray-100 border rounded-lg text-center font-normal dark:border-gray-50 dark:text-gray-50 dark:bg-slate-900">
      Time Left: {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
