"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, UserPlus, Filter, Award, BookOpen, Clock, Search, Lock } from "lucide-react";
import UpgradePromptModal from "./UpgradePromptModal";
import { getConnectData } from "@/actions/connect";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";

export default function AspirantConnect() {
  const { role } = useParams();
  const isAspirant = role === "aspirant";
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState("mentors");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await getConnectData();
      if (res.success) {
        setData(res.data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const studentsToMap = data?.peers || [
    { id: 1, name: "David O.", level: "400 Level", role: "Faculty President" },
    { id: 2, name: "Sarah A.", level: "200 Level", role: "Top Scholar" },
  ];

  const postsToMap = data?.recentDiscussions || [
    { 
      id: 1, 
      content: "Which textbook is best for PHY101?", 
      authorName: "Anonymous Aspirant", 
      authorLevel: "Aspirant", 
      createdAt: new Date(Date.now() - 7200000) 
    }
  ];

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 min-h-screen bg-zinc-50 dark:bg-zinc-950 font-poppins space-y-8">
      
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-bold font-open-sans">Student Connect</h1>
           <p className="text-zinc-500 mt-2">Find a mentor or join subject discussion groups.</p>
        </div>
        
        <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl w-full md:w-auto">
          {["mentors", "groups", "feed"].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "bg-white dark:bg-zinc-900 shadow-sm" : "hover:bg-black/5"}`}
             >
                {tab}
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Main Feed / Content */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-2">
                 <Search className="w-5 h-5 text-zinc-400" />
                 <input 
                   type="text" 
                   placeholder="Search students by name, interest, or level..." 
                   className="bg-transparent border-none outline-none w-full text-sm"
                 />
              </div>
              <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                 <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Mentor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {studentsToMap.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No verified students found in your department yet.</p>
               ) : studentsToMap.map((s: any, i: number) => (
                 <motion.div 
                   key={s.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                 >
                    <div className="flex gap-4 items-start mb-4">
                       <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-xl font-bold text-blue-700 dark:text-blue-300">
                          {s.name?.charAt(0) || "U"}
                       </div>
                       <div>
                          <h3 className="font-bold text-lg">{s.name}</h3>
                          <div className="flex items-center gap-2 text-xs">
                             <Award className="w-3 h-3 text-yellow-500" /> {s.role || "Peer Mentor"}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md inline-block mt-2">
                             Level {s.level}
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                       <button onClick={() => isAspirant ? setShowUpgradeModal(true) : alert("Messaging coming soon")} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                         <MessageCircle className="w-4 h-4" /> Message
                       </button>
                       <button onClick={() => isAspirant ? setShowUpgradeModal(true) : alert("Connection coming soon")} className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold p-2 px-4 rounded-xl text-sm transition-colors flex items-center justify-center">
                         <UserPlus className="w-4 h-4" />
                       </button>
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* Q&A Snippet */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 mt-8 relative overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-open-sans">Recent Discussions</h2>
                 <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">View all</button>
               </div>
               
               <div className="space-y-4 relative z-10">
                  {postsToMap.map((post: any) => (
                    <div key={post.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                       <div className="flex gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            {post.authorName?.charAt(0) || "A"}
                          </div>
                          <div>
                             <div className="font-semibold text-sm">{post.authorName} <span className="text-xs font-normal text-zinc-500">(Lvl {post.authorLevel})</span></div>
                             <div className="text-xs text-zinc-500">{formatDistanceToNow(new Date(post.createdAt))} ago</div>
                          </div>
                       </div>
                       <p className="font-medium mt-2">{post.content}</p>
                    </div>
                  ))}
               </div>
               
               {/* Blur Overlay for more posts */}
               {isAspirant && (
                 <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent flex items-end justify-center pb-6 z-20">
                   <button onClick={() => setShowUpgradeModal(true)} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border border-transparent hover:border-zinc-700 px-6 py-2 rounded-full font-semibold text-sm shadow-xl transition-all">
                      Unlock Full Community
                   </button>
                 </div>
               )}
            </div>
         </div>

         {/* Right Sidebar */}
         <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
               <div className="relative z-10">
                 <h3 className="font-bold text-xl mb-2 font-open-sans">Study Groups</h3>
                 <p className="text-blue-100 text-sm mb-6">Join active study groups organized by verified students and faculty reps.</p>
                 
                 <div className="space-y-3">
                   {['Core Sciences Review', 'Engineering Drafting', 'Coding Bootcamp 101'].map((g, i) => (
                     <div key={i} className="bg-white/10 backdrop-blur border border-white/20 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/20 transition-colors" onClick={() => isAspirant ? setShowUpgradeModal(true) : alert("Coming soon")}>
                        <span className="font-medium text-sm">{g}</span>
                        {isAspirant ? <Lock className="w-4 h-4 opacity-70" /> : <UserPlus className="w-4 h-4 opacity-70" />}
                     </div>
                   ))}
                 </div>
               </div>

               {/* Decorative */}
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>
         </div>
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
