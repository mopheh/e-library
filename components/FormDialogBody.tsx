// components/FormModal.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

export default function FormModal({
  open,
  setOpen,
  children,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  children: ReactNode
}) {
  const zoomVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={zoomVariants}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl p-6 w-[90%] max-w-md"
              variants={zoomVariants}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold font-cabin">New Entry</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 cursor-pointer hover:text-gray-800"
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
  )
}
