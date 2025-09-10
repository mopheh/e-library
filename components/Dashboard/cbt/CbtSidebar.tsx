"use client";
import { cn } from "@/lib/utils";

export default function CbtSidebar({
  questions,
  answers,
  currentIdx,
  onNavigate,
}: any) {
  return (
    <div className="space-y-3">
      <h2 className="font-normal text-lg font-cabin dark:text-gray-200">
        Questions
      </h2>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q: any, i: number) => (
          <button
            key={q.id}
            onClick={() => onNavigate(i)}
            className={cn(
              "w-10 h-10 rounded-full font-light border flex items-center justify-center text-xs font-poppins transition-colors",
              i === currentIdx
                ? "bg-blue-500 text-white"
                : answers[q.id]
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
