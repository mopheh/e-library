"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft, BookOpen, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px] dark:bg-indigo-900"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative max-w-md w-full text-center space-y-8"
      >
        {/* Icon Container */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-tr from-zinc-200 to-white dark:from-zinc-900 dark:to-zinc-800 rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 ring-1 ring-zinc-900/5 dark:ring-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AlertCircle className="w-10 h-10 text-zinc-900 dark:text-zinc-100 relative z-10" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 font-cairo">
            404
          </h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-open-sans">
              This page drifted out of the library.
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400 font-poppins max-w-xs mx-auto">
              The chapter you are looking for doesn't exist or has been moved to another shelf.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            asChild
            variant="default"
            size="lg"
            className="w-full sm:w-auto font-medium font-poppins h-11 px-8 shadow-lg shadow-indigo-500/20"
          >
            <Link href="/student/dashboard" className="flex items-center gap-2">
              <MoveLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto font-medium font-poppins h-11 px-8 bg-transparent border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <Link href="/student/library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Go to Library
            </Link>
          </Button>
        </div>
        
        {/* Footer help link */}
        <div className="pt-8">
            <Link href="/support" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors font-poppins">
                Need help finding something?
            </Link>
        </div>
      </motion.div>
    </div>
  );
}
