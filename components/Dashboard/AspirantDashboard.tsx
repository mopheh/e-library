"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { BookOpen, Target, Users, ArrowRight, Lock, Award, Zap } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import UpgradePromptModal from "../aspirant/UpgradePromptModal";

export default function AspirantDashboard() {
  const { user, isLoaded } = useUser();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  if (!isLoaded) return <div className="animate-pulse flex h-screen bg-zinc-50 dark:bg-zinc-900" />;

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
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen font-poppins text-zinc-900 dark:text-zinc-100">
      
      {/* Welcome Hero */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 p-8 sm:p-12 text-white shadow-xl"
      >
        <div className="relative z-10 max-w-2xl">
          <motion.h1 variants={itemVariants} className="text-3xl sm:text-5xl font-bold mb-4 font-open-sans">
            Welcome to your future, {user?.firstName || "Aspirant"}.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-blue-100 text-lg mb-8">
            Start preparing for your Post-UTME, connect with current students, and explore your future department at UniVault.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            <Link href="/dashboard/cbt">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-2 shadow-lg">
                <Zap className="w-5 h-5" /> Start Mock CBT
              </button>
            </Link>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-black/20 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full font-semibold hover:bg-black/30 transition-colors flex items-center gap-2"
            >
              <Award className="w-5 h-5" /> Claim Admission
            </button>
          </motion.div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-20 hidden md:block">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M45.7,-76.4C58.9,-69.3,69.5,-55.5,78.2,-41C86.9,-26.5,93.8,-11.3,92.5,3.3C91.1,17.9,81.6,31.9,71.2,43.7C60.8,55.5,49.6,65.2,36.5,72.4C23.4,79.6,8.5,84.4,-6.1,86.2C-20.7,88.1,-35.1,87,-48.1,80.5C-61.1,74,-72.7,62.2,-81.2,48.2C-89.8,34.2,-95.2,18,-95.8,1.6C-96.4,-14.8,-92.2,-31.4,-82.9,-44.6C-73.6,-57.8,-59.1,-67.7,-44.5,-73.9C-29.9,-80.1,-15,-82.6,0.6,-83.6C16.2,-84.5,32.5,-83.5,45.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Target & Roadmap */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-open-sans flex items-center gap-2">
                <Target className="text-blue-500" /> Study Roadmap
              </h2>
              <span className="text-sm font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">Week 2 of 4</span>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Overall Progress</span>
                  <span className="font-semibold">45%</span>
                </div>
                <Progress value={45} className="h-2 bg-zinc-100 dark:bg-zinc-800" />
              </div>

              <div className="space-y-3">
                {[
                  { title: "Mathematics Review", status: "completed", type: "Material" },
                  { title: "Physics Fundamentals", status: "in-progress", type: "CBT Mock" },
                  { title: "English Lexis & Structure", status: "locked", type: "Material" },
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                       task.status === "completed" ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                       task.status === "in-progress" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                       "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                     }`}>
                       {task.status === "locked" ? <Lock className="w-4 h-4" /> : <BookOpen className="w-5 h-5" />}
                     </div>
                     <div className="flex-1">
                       <h4 className="font-semibold text-sm">{task.title}</h4>
                       <span className="text-xs text-zinc-500">{task.type}</span>
                     </div>
                     <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Col: Connect & Locked Content */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="space-y-6">
          
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
             <h2 className="text-lg font-bold font-open-sans mb-4 flex items-center gap-2">
                <Users className="text-blue-500" /> Connect with Seniors
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Talk to students already studying your intended course. Ask about exams, life on campus, and more.
              </p>
              <Link href="/dashboard/connect">
                <button className="w-full bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-3 rounded-xl text-sm font-semibold transition-colors">
                  Find a Mentor
                </button>
              </Link>
          </div>

          <div className="relative rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
             {/* Locked Content Blur effect */}
             <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40 dark:bg-black/40 z-10 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-white dark:bg-zinc-800 shadow-lg rounded-full flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5 text-zinc-400" />
                </div>
                <h3 className="font-bold text-sm mb-1">Premium Internal Resources</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">Available for verified admitted students</p>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-xs font-semibold hover:scale-105 transition-transform"
                >
                  Verify Admission
                </button>
             </div>
             
             {/* Mock Background Content underneath blur */}
             <div className="opacity-50 select-none">
                <h2 className="text-lg font-bold mb-4">Department Materials</h2>
                <div className="space-y-3">
                  <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
                  <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
                </div>
             </div>
          </div>

        </motion.div>
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
