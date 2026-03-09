"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Lock, PlayCircle, FileText, ArrowRight, TrendingUp } from "lucide-react";
import UpgradePromptModal from "./UpgradePromptModal";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

export default function StudyRoadmap() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const roadmapData = [
    {
       week: 1, 
       title: "Physics & Chemistry Basics",
       status: "completed",
       tasks: [
         { type: "Material", name: "Motion & Mechanics Primer", completed: true, locked: false },
         { type: "Material", name: "Atomic Structure", completed: true, locked: false },
         { type: "Video", name: "Intro to Stoichiometry", completed: true, locked: false },
       ]
    },
    {
       week: 2, 
       title: "Advanced Math & English",
       status: "current",
       tasks: [
         { type: "Material", name: "Calculus Fundamentals", completed: true, locked: false },
         { type: "Quiz", name: "Post-UTME Lexis & Structure", completed: false, locked: false },
         { type: "Material", name: "Comprehension Passages", completed: false, locked: false },
       ]
    },
    {
       week: 3, 
       title: "Intensive Mock Training",
       status: "upcoming",
       tasks: [
         { type: "CBT", name: "Full 100-Question Mock A", completed: false, locked: true },
         { type: "Material", name: "Review of Common Mistakes", completed: false, locked: true },
       ]
    },
    {
       week: 4, 
       title: "Final Revisions",
       status: "upcoming",
       tasks: [
         { type: "CBT", name: "Live Simulator Challenge", completed: false, locked: true },
         { type: "Video", name: "Exam Day Strategies", completed: false, locked: true },
       ]
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold font-open-sans">Study Roadmap</h1>
           <p className="text-zinc-500 mt-2">Your guided path to passing the Post-UTME.</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex gap-4 shadow-sm">
           <div>
              <div className="text-sm text-zinc-500 mb-1">Overall Completion</div>
              <div className="flex items-center gap-3">
                 <Progress value={35} className="h-2 w-32 bg-zinc-100 dark:bg-zinc-800" /> 
                 <span className="font-bold">35%</span>
              </div>
           </div>
           <div className="w-px bg-zinc-200 dark:bg-zinc-800"></div>
           <div>
              <div className="text-sm text-zinc-500 mb-1">Learning Streak</div>
              <div className="flex items-center gap-2 font-bold text-orange-500">
                 <TrendingUp className="w-4 h-4" /> 5 Days
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative">
         
         {/* Vertical Timeline Line */}
         <div className="absolute left-8 md:left-24 top-8 bottom-8 w-1 bg-zinc-200 dark:bg-zinc-800 rounded-full hidden md:block z-0"></div>

         {roadmapData.map((week, idx) => (
           <motion.div 
             key={idx}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.1 }}
             className="relative z-10 flex flex-col md:flex-row gap-6 items-start"
           >
              {/* Timeline marker */}
              <div className="hidden md:flex flex-col items-center justify-center w-48 shrink-0 relative mt-(!week)">
                 <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg bg-white dark:bg-zinc-900 ${
                   week.status === 'completed' ? 'border-green-500 text-green-500' :
                   week.status === 'current' ? 'border-blue-500 text-blue-500' :
                   'border-zinc-300 dark:border-zinc-700 text-zinc-400'
                 }`}>
                    {week.week}
                 </div>
                 <div className="text-sm font-semibold mt-4">WEEK {week.week}</div>
              </div>

              {/* Mobile Week Badge */}
              <div className="md:hidden inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                 Week {week.week}
              </div>

              {/* Card */}
              <div className={`flex-1 w-full bg-white dark:bg-zinc-900 border rounded-3xl p-6 shadow-sm ${
                week.status === 'current' ? 'border-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20' : 'border-zinc-200 dark:border-zinc-800'
              }`}>
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold font-open-sans">{week.title}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${
                      week.status === 'completed' ? 'bg-green-100 text-green-700' :
                      week.status === 'current' ? 'bg-blue-100 text-blue-700' :
                      'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {week.status}
                    </span>
                 </div>

                 <div className="space-y-3">
                   {week.tasks.map((task, i) => (
                     <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                       task.locked ? 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 opacity-60' : 
                       'border-zinc-100 dark:border-zinc-800 hover:border-blue-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors'
                     }`}>
                        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                          task.locked ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800' :
                          task.completed ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                           {task.locked ? <Lock className="w-4 h-4" /> : task.completed ? <CheckCircle className="w-5 h-5" /> : 
                             task.type === 'Material' ? <FileText className="w-4 h-4" /> : 
                             task.type === 'CBT' || task.type === 'Quiz' ? <CheckCircle className="w-4 h-4" /> : 
                             <PlayCircle className="w-4 h-4" />
                           }
                        </div>
                        
                        <div className="flex-1">
                           <div className="font-semibold text-sm sm:text-base">{task.name}</div>
                           <div className="text-xs text-zinc-500">{task.type}</div>
                        </div>

                        {!task.locked && !task.completed && (
                           <Link href={task.type === "Quiz" || task.type === "CBT" ? "/aspirant/cbt" : "#"}>
                              <button className="text-blue-600 dark:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                 <ArrowRight className="w-5 h-5" />
                              </button>
                           </Link>
                        )}
                        {task.locked && (
                           <button onClick={() => setShowUpgradeModal(true)} className="text-zinc-400 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                               <Lock className="w-5 h-5" />
                           </button>
                        )}
                     </div>
                   ))}
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
