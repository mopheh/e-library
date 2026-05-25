"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, ArrowRight, Play, FileText, ScrollText, HelpCircle, BookMarked, GraduationCap } from "lucide-react";
import Link from "next/link";
import { getRecentlyViewedBooks } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  textbook:       { icon: BookMarked,     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  "past question":{ icon: HelpCircle,     color: "text-rose-500 dark:text-rose-400",       bg: "bg-rose-100 dark:bg-rose-900/30" },
  material:       { icon: FileText,       color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-100 dark:bg-blue-900/30" },
  note:           { icon: ScrollText,     color: "text-violet-600 dark:text-violet-400",   bg: "bg-violet-100 dark:bg-violet-900/30" },
  research:       { icon: GraduationCap,  color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-100 dark:bg-amber-900/30" },
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="3" />
      <motion.circle
        cx="18" cy="18" r={r} fill="none"
        className="stroke-blue-600 dark:stroke-blue-500"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: dash }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}

const ContinueReading = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const recent = getRecentlyViewedBooks();
    setBooks(recent);
    const t = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin mb-0.5">
            Resume
          </p>
          <h3 className="text-base font-black font-cabin tracking-tighter text-zinc-900 dark:text-zinc-50">
            Continue Reading
          </h3>
        </div>
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          All books <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  <div className="h-2 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
              </div>
            ))}
          </motion.div>
        ) : books.length > 0 ? (
          <motion.div
            key="books"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {books.slice(0, 4).map((book, i) => {
              const typeKey = book.type?.toLowerCase() as string;
              const typeCfg = TYPE_CONFIG[typeKey] ?? {
                icon: BookOpen,
                color: "text-zinc-500",
                bg: "bg-zinc-100 dark:bg-zinc-800",
              };
              const TypeIcon = typeCfg.icon;
              const progress = typeof book.progress === "number" ? book.progress : 0;

              return (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/book/${book.id}`}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-all group"
                  >
                    {/* Type icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeCfg.bg}`}>
                      <TypeIcon className={`w-4.5 h-4.5 ${typeCfg.color}`} />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-poppins text-zinc-800 dark:text-zinc-100 truncate leading-tight">
                        {book.title || "Untitled"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Progress bar */}
                        <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[80px]">
                          <motion.div
                            className="h-full rounded-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 + 0.2, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[10px] font-black font-cabin text-zinc-400">
                          {progress}%
                        </span>
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600">·</span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins">
                          <Clock className="w-3 h-3" />
                          {timeAgo(book.updatedAt ?? book.lastOpened)}
                        </span>
                      </div>
                    </div>

                    {/* Resume ring + play button */}
                    <div className="relative shrink-0 flex items-center justify-center w-9 h-9">
                      <ProgressRing pct={progress} />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
                          <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {/* "More" nudge if there are more than 4 */}
            {books.length > 4 && (
              <Link
                href="/library"
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-black font-cabin uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                +{books.length - 4} more books
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
            </div>
            <div>
              <p className="text-sm font-black font-cabin text-zinc-400 uppercase tracking-wider mb-1">
                Nothing yet
              </p>
              <p className="text-xs text-zinc-400 font-poppins">
                Open any book from the library to see it here.
              </p>
            </div>
            <Link
              href="/library"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-[10px] font-black font-cabin uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md"
            >
              Browse Library <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContinueReading;
