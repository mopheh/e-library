"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { BookOpen, Target, Users, ArrowRight, Lock, Award, Zap } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import UpgradePromptModal from "../aspirant/UpgradePromptModal";
import StudyCarousel from "./StudyCarousel";

export default function AspirantDashboard() {
  const { user, isLoaded } = useUser();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  if (!isLoaded) return (
     <div className="flex h-screen items-center justify-center premium-bg">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-8 premium-bg min-h-screen font-poppins text-zinc-900 dark:text-zinc-100 italic-none">
      
      {/* 0. Top Section: Carousel & Welcome */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
           <StudyCarousel />
        </div>
        <div className="lg:col-span-4 h-full">
           <div className="glass-card p-8 h-full rounded-[2rem] flex flex-col justify-center bg-gradient-to-br from-blue-600 to-indigo-800 text-white border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Award className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-2">Claim Your Future</h3>
              <p className="text-sm text-blue-100 mb-6 font-medium">Verify your admission and unlock premium department materials.</p>
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm w-fit hover:scale-105 transition-transform shadow-lg"
              >
                 Verify Now
              </button>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Target & Roadmap */}
        <motion.div 
           variants={containerVariants}
           initial="hidden"
           animate="show"
           className="col-span-1 md:col-span-2 space-y-6"
        >
          <div className="glass-card rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Target className="text-blue-600 w-5 h-5" />
                </div>
                Study Roadmap
              </h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full">Week 2 of 4</span>
            </div>
            
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-sm mb-3 px-1">
                  <span className="text-zinc-500 font-medium">Overall Progress</span>
                  <span className="font-bold text-blue-600">45%</span>
                </div>
                <Progress value={45} className="h-2.5 bg-zinc-100 dark:bg-zinc-800" />
              </div>

              <div className="grid gap-3">
                {[
                  { title: "Mathematics Review", status: "completed", type: "Material" },
                  { title: "Physics Fundamentals", status: "in-progress", type: "CBT Mock" },
                  { title: "English Lexis & Structure", status: "locked", type: "Material" },
                ].map((task, i) => (
                  <motion.div 
                    key={i} 
                    variants={itemVariants}
                    className="flex items-center gap-5 p-4 rounded-2xl hover:bg-white dark:hover:bg-zinc-900 transition-all group cursor-pointer border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 shadow-sm hover:shadow-md"
                  >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                       task.status === "completed" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" :
                       task.status === "in-progress" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                       "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                     }`}>
                       {task.status === "locked" ? <Lock className="w-5 h-5" /> : <BookOpen className="w-6 h-6" />}
                     </div>
                     <div className="flex-1">
                       <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{task.title}</h4>
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{task.type}</span>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                     </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Col: Connect & Locked Content */}
        <div className="space-y-8">
          
          <div className="glass-card rounded-[2rem] p-8 border-emerald-100 dark:border-emerald-900/30">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-emerald-600">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Users className="w-5 h-5" />
                </div>
                Connect
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed mb-8 font-medium">
                Talk to students already studying your intended course. Ask about exams, life on campus, and more.
              </p>
              <Link href="/dashboard/connect">
                <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-colors active:scale-95">
                  Find a Mentor
                </button>
              </Link>
          </div>

          <div className="relative glass-card rounded-[2rem] p-8 overflow-hidden">
             {/* Locked Content Blur effect */}
             <div className="absolute inset-0 backdrop-blur-[4px] bg-white/40 dark:bg-black/60 z-10 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-white dark:bg-zinc-800 shadow-2xl rounded-3xl flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-700/50">
                  <Lock className="w-6 h-6 text-zinc-400" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">Premium Resources</h3>
                <p className="text-xs text-zinc-500 mb-6 font-medium">Available for verified admitted students</p>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-2xl text-xs font-bold hover:scale-105 transition-transform active:scale-95 shadow-xl"
                >
                  Verify Now
                </button>
             </div>
             
             {/* Mock Background Content underneath blur */}
             <div className="opacity-20 select-none blur-[2px]">
                <h2 className="text-lg font-bold mb-4">Department Materials</h2>
                <div className="space-y-4">
                  <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"></div>
                  <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"></div>
                </div>
             </div>
          </div>

        </div>
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
