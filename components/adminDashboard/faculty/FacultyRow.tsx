"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUsers } from "@/hooks/useUsers";
import { UserPlus, ChevronDown, ChevronUp, Users, ShieldCheck } from "lucide-react";
import AddRepModal from "./AddRepModal";
import { User } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FACULTY_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-fuchsia-600",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FACULTY_COLORS[Math.abs(hash) % FACULTY_COLORS.length];
}

const FacultyRow = ({
  facultyId,
  name,
}: {
  facultyId: string;
  name: string;
}) => {
  const { data: users, isLoading } = useUsers(facultyId);
  const [openRepModal, setOpenRepModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const reps = (users ?? []).filter((u: User) => u.role === "FACULTY REP");
  const students = (users ?? []).filter((u: User) => u.role === "STUDENT");
  const maxRepsReached = reps.length >= 2;
  const gradient = getGradient(name);

  return (
    <>
      <motion.div
        layout
        className="group rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/60 transition-all duration-200 overflow-hidden"
      >
        {/* Main row */}
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black font-cabin text-sm shrink-0 shadow-md`}
          >
            {name.charAt(0).toUpperCase()}
          </div>

          {/* Name & meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 font-cabin truncate">
              {name}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              {isLoading ? (
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
              ) : (
                <>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-poppins">
                    <Users className="w-3 h-3" />
                    {students.length} students
                  </span>
                  {reps.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-poppins">
                      <ShieldCheck className="w-3 h-3" />
                      {reps.length} rep{reps.length > 1 ? "s" : ""}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Rep avatars */}
          {reps.length > 0 && (
            <TooltipProvider>
              <div className="hidden sm:flex -space-x-2 shrink-0">
                {reps.map((rep: User, idx: number) => (
                  <Tooltip key={rep.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-8 h-8 rounded-xl border-2 border-white dark:border-zinc-950 overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black font-cabin text-[10px] shadow-sm hover:scale-110 transition-transform cursor-default"
                        style={{ zIndex: reps.length - idx }}
                      >
                        {rep.imageUrl ? (
                          <img src={rep.imageUrl} alt={rep.fullName} className="w-full h-full object-cover" />
                        ) : (
                          rep.fullName?.charAt(0).toUpperCase()
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-zinc-800">
                      <p className="text-xs font-bold text-white font-poppins">{rep.fullName}</p>
                      <p className="text-[10px] text-zinc-400 font-poppins">{rep.email}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!maxRepsReached && (
              <button
                onClick={() => setOpenRepModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest font-cabin text-zinc-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Assign Rep</span>
              </button>
            )}

            {/* Expand toggle */}
            {reps.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded rep details */}
        <AnimatePresence>
          {expanded && reps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin mb-2">
                  Faculty Representatives
                </p>
                {reps.map((rep: User) => (
                  <div
                    key={rep.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30"
                  >
                    <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black font-cabin text-xs shrink-0">
                      {rep.imageUrl ? (
                        <img src={rep.imageUrl} alt={rep.fullName} className="w-full h-full object-cover" />
                      ) : (
                        rep.fullName?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-cabin truncate">
                        {rep.fullName}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-poppins truncate">{rep.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black font-cabin uppercase tracking-widest shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Rep
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AddRepModal
        open={openRepModal}
        onCancel={() => setOpenRepModal(false)}
        facultyId={facultyId}
        facultyName={name}
      />
    </>
  );
};

export default FacultyRow;
