"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradePromptModal({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-3xl">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Header Banner */}
              <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 z-10 text-white shadow-xl isolate">
                  <Lock className="w-8 h-8" />
                </div>
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
              </div>

              <div className="p-6 text-center space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold font-open-sans">Verify Your Admission</DialogTitle>
                  <DialogDescription className="text-zinc-600 dark:text-zinc-400 text-base">
                    You have discovered a premium academic resource. This material is exclusively available for verified admitted students.
                  </DialogDescription>
                </DialogHeader>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl text-left border border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                     <GraduationCap className="w-4 h-4 text-purple-500" /> Unlock benefits:
                  </h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Access to full lecture notes</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Departmental past questions</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Premium digital textbooks</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Link href="/aspirant/verify" onClick={onClose}>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 group">
                      Request Student Verification
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <button onClick={onClose} className="w-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-2 text-sm font-medium transition-colors">
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
