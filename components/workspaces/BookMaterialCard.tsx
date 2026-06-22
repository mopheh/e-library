"use client";

import React from "react";
import { BookOpen, Layers, HelpCircle, FileText, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";
import { WorkspaceBook } from "./types";

export const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; gradient: string; badge: string }
> = {
  Textbook: {
    icon: BookOpen,
    gradient: "from-violet-500 to-purple-600",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  Material: {
    icon: Layers,
    gradient: "from-blue-500 to-cyan-600",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  "Past Questions": {
    icon: HelpCircle,
    gradient: "from-amber-500 to-orange-600",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  "Lecture Notes": {
    icon: FileText,
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
};

export const FALLBACK_CONFIG = {
  icon: Layers,
  gradient: "from-slate-500 to-zinc-600",
  badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

interface BookMaterialCardProps {
  book: WorkspaceBook;
  courseId: string;
}

export const BookMaterialCard = ({ book, courseId }: BookMaterialCardProps) => {
  const config = TYPE_CONFIG[book.type] || FALLBACK_CONFIG;
  const Icon = config.icon;
  const isIndexed =
    book.parseStatus === "completed" || book.parseStatus === "parsed";
  const fileSizeMB = book.fileSize
    ? (book.fileSize / (1024 * 1024)).toFixed(1)
    : null;

  return (
    <div className="group relative flex gap-3 p-4 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all duration-200">
      {/* Type icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}
      >
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug font-poppins"
            title={book.title}
          >
            {book.title}
          </p>
          {isIndexed && (
            <span
              className="flex-shrink-0 flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full font-poppins"
              title="AI-indexed"
            >
              <Zap className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className={`text-[9px] font-medium rounded-full px-2 py-0.5 ${config.badge} font-poppins`}>
            {book.type}
          </span>
          {fileSizeMB && (
            <span className="text-[9px] text-zinc-400 font-mono">{fileSizeMB} MB</span>
          )}
          {book.pageCount && (
            <span className="text-[9px] text-zinc-400 font-poppins">
              {book.pageCount} pages
            </span>
          )}
        </div>
      </div>

      {/* Open link */}
      {book.fileUrl && (
        <Link
          href={`/book/${book.id}`}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Open reader"
        >
          <ExternalLink className="w-4 h-4 text-zinc-500" />
        </Link>
      )}
    </div>
  );
};
