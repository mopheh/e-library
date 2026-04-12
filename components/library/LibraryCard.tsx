import React from "react";
import { formatBytes } from "@/lib/utils";
import { BookOpen, FileBadge, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Book } from "@/types";

export const LibraryCard = ({ book, onPreview }: { book: Book, onPreview: (book: Book) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onPreview(book)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
          <BookOpen className="h-6 w-6" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-800 dark:text-zinc-200 uppercase">
            {book.type}
          </span>
          {book.fileSize && (
            <span className="text-[10px] font-medium text-zinc-500">
              {formatBytes(book.fileSize)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold font-cabin leading-tight text-zinc-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        <p className="text-xs font-poppins text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {book.description || "No description provided."}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5 font-medium truncate max-w-[60%]">
          <FileBadge className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{book.course || "General"}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(book.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </motion.div>
  );
};
