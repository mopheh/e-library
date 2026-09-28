// components/FormModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export default function FormModal({
  open,
  setOpen,
  children,
  size = "md",
  title = "New Entry",
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
  /** "lg" gives content-heavy forms (e.g. book upload) more breathing room. */
  size?: "md" | "lg";
  title?: string;
}) {
  const zoomVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            // z-[110] keeps the modal above the mobile bottom nav (z-[100]),
            // which otherwise covers the form's submit button on phones.
            className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-end sm:items-center justify-center z-[110]"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={zoomVariants}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className={`bg-white dark:bg-zinc-950 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 w-full sm:w-[90%] ${size === "lg" ? "sm:max-w-xl" : "sm:max-w-md"} max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain`}
              style={{ paddingBottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
              variants={zoomVariants}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold font-cabin">{title}</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 cursor-pointer hover:text-zinc-800"
                >
                  ✕
                </button>
              </div>

              {/* form goes here */}
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
