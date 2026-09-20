import { ReactNode } from "react";
import { BookMarked, HelpCircle, FileText, ScrollText, GraduationCap } from "lucide-react";

/**
 * Single source of truth for the book "type" taxonomy used across the
 * upload form, department book tables, and AI-question eligibility checks.
 * Keep values lower-case — they're matched against `book.type` as stored.
 */
export const BOOK_TYPES = ["textbook", "past question", "material", "note", "research"] as const;
export type BookType = (typeof BOOK_TYPES)[number];

export const TYPE_STYLES: Record<string, { color: string; icon: ReactNode; label: string }> = {
  textbook: {
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: <BookMarked className="w-3.5 h-3.5" />,
    label: "Textbook",
  },
  "past question": {
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    label: "Past Question",
  },
  material: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <FileText className="w-3.5 h-3.5" />,
    label: "Material",
  },
  note: {
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    icon: <ScrollText className="w-3.5 h-3.5" />,
    label: "Note",
  },
  research: {
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    label: "Research",
  },
};

export const DEFAULT_TYPE_STYLE = {
  color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  icon: <FileText className="w-3.5 h-3.5" />,
  label: "Other",
};

// Book types that support AI question generation
export const QUESTION_ELIGIBLE_TYPES = new Set(["past question", "material", "handout"]);
