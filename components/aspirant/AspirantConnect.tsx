"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Pusher from "pusher-js";
import { 
  MessageCircle, 
  UserPlus, 
  Filter, 
  Award, 
  BookOpen, 
  Clock, 
  Search, 
  Lock, 
  UserCheck, 
  Sparkles, 
  TrendingUp, 
  Users as UsersIcon,
  ChevronRight,
  Send,
  Plus,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import UpgradePromptModal from "./UpgradePromptModal";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { getConnectData, createDiscussionPost, updateUserInterests } from "@/actions/connect";
import { formatDistanceToNow } from "date-fns";
import { useUserData } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";


export default function AspirantConnect() {
  const { data: userData } = useUserData();
  const role = userData?.role?.toLowerCase() || "student";
  const isAspirant = role === "aspirant";
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showExpertisePrompt, setShowExpertisePrompt] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    const res = await getConnectData();
    if (res.success) {
      setData(res.data);
      // Show expertise prompt if current student has no interests
      if (!isAspirant && !res.data.interests) {
        setShowExpertisePrompt(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [isAspirant]);

  // Pusher setup for real-time updates (discussions & connection statuses)
  useEffect(() => {
    if (!userData?.id || !data?.departmentId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // Sub to community feed
    const communityChannel = pusher.subscribe(`dept-community-${data.departmentId}`);
    communityChannel.bind("new-post", (newPost: any) => {
      setData((prev: any) => ({
        ...prev,
        recentDiscussions: [newPost, ...(prev?.recentDiscussions || [])].slice(0, 10)
      }));
    });

    // Sub to private user channel for connection updates
    const userChannel = pusher.subscribe(`user-${userData.id}`);
    userChannel.bind("connection-accepted", ({ peerId }: { peerId: string }) => {
      setData((prev: any) => {
        if (!prev?.peers) return prev;
        return {
          ...prev,
          peers: prev.peers.map((p: any) => 
            p.id === peerId ? { ...p, connectionStatus: "ACCEPTED" } : p
          )
        };
      });
      toast.success("Connection established!");
    });

    return () => {
      pusher.unsubscribe(`dept-community-${data.departmentId}`);
      pusher.unsubscribe(`user-${userData.id}`);
    };
  }, [data?.departmentId, userData?.id]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    setIsPosting(true);
    try {
      const res = await createDiscussionPost(newPostContent);
      if (res.success) {
        setNewPostContent("");
        toast.success("Post shared with community!");
      } else {
        toast.error(res.error || "Failed to post");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpdateInterests = async () => {
    if (selectedTags.length === 0) return toast.error("Please select at least one interest");
    
    setIsUpdating(true);
    try {
      const interestsString = selectedTags.join(", ");
      const res = await updateUserInterests(interestsString);
      if (res.success) {
        toast.success("Expertise updated!");
        setShowExpertisePrompt(false);
        refreshData();
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (!customTag.trim()) return;
    if (selectedTags.includes(customTag.trim())) return setCustomTag("");
    setSelectedTags(prev => [...prev, customTag.trim()]);
    setCustomTag("");
  };

  const studentsToMap = data?.peers || [];
  const postsToMap = data?.recentDiscussions || [];

  const suggestedTags = [
    "Machine Learning", "Quantum Physics", "Data Structures", 
    "Thermodynamics", "Organic Chemistry", "Academic Writing",
    "Calculus", "UI/UX Design", "Java", "Python"
  ];

  return (
    <div className="flex-1 p-4 md:p-10 pt-6 min-h-screen bg-white dark:bg-zinc-950 font-poppins space-y-10">
      
      {loading && !data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-md">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
        </div>
      )}

      {/* Expertise Onboarding Card (States for real Students) */}
      <AnimatePresence>
        {showExpertisePrompt && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group mb-10"
          >
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-100 font-bold text-xs uppercase tracking-widest">
                   <Award className="w-4 h-4" /> Personalize Your Profile
                </div>
                <h2 className="text-3xl font-bold font-cabin tracking-tight">What's your expertise?</h2>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-start gap-3 border border-white/10">
                   <Info className="w-5 h-5 mt-0.5 shrink-0" />
                   <p className="text-sm font-light leading-relaxed">
                     Help us personalize your hub! Listing your interests allows peers to discover you for mentorship and helps UniVault suggest the most relevant study circles for your academic path.
                   </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                   {suggestedTags.map(tag => (
                     <button 
                       key={tag}
                       type="button"
                       onClick={() => toggleTag(tag)}
                       className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${selectedTags.includes(tag) ? "bg-white text-blue-600 border-white shadow-lg" : "bg-white/10 hover:bg-white/20 border-white/20"}`}
                     >
                       {tag}
                     </button>
                   ))}
                </div>

                <div className="flex gap-2 pt-2">
                   <Input 
                     placeholder="Type custom interest..."
                     value={customTag}
                     onChange={(e) => setCustomTag(e.target.value)}
                     className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 rounded-xl h-10 text-xs"
                     onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                   />
                   <button 
                     type="button"
                     onClick={addCustomTag}
                     className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all shrink-0"
                   >
                     Add +
                   </button>
                </div>

                {selectedTags.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 flex justify-end"
                  >
                    <button 
                      onClick={handleUpdateInterests}
                      disabled={isUpdating}
                      className="px-8 py-3 bg-white text-blue-600 rounded-[1.5rem] text-sm font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" /> : "Save My Profile"}
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Discovery Hub */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> Discovery Hub
             </div>
             <h1 className="text-4xl font-bold font-cabin tracking-tight">Connect with Peers</h1>
             <p className="text-zinc-500 dark:text-zinc-400 max-w-xl font-light">
               Join your department's academic network. Find mentors, study partners, and join verified discussion circles.
             </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end px-4 border-r border-zinc-200 dark:border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium">Community Status</span>
                <span className="text-sm font-bold text-green-500 flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   Live Community
                </span>
             </div>
             <button className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-3 rounded-2xl transition-all">
                <Filter className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
             </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { id: "all", label: "All Discovery", icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { id: "mentors", label: "Top Mentors", icon: <Award className="w-3.5 h-3.5" /> },
            { id: "new", label: "Recently Joined", icon: <Clock className="w-3.5 h-3.5" /> },
            { id: "faculty", label: "Faculty Reps", icon: <UsersIcon className="w-3.5 h-3.5" /> }
          ].map((f) => (
             <button 
               key={f.id}
               onClick={() => setActiveFilter(f.id)}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border shadow-sm ${activeFilter === f.id ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/20" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
             >
                {f.icon} {f.label}
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Discovery Content */}
         <div className="lg:col-span-8 space-y-10">
            
            {/* Featured Mentors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {studentsToMap.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                     <UsersIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                     <h3 className="text-xl font-bold font-cabin">Build the Network</h3>
                     <p className="text-zinc-500 text-sm mt-2 max-w-xs mx-auto font-light">
                        No verified students found in your department yet. Tell your classmates to join UniVault!
                     </p>
                  </div>
               ) : (
                 studentsToMap.map((s: any, i: number) => (
                   <motion.div 
                     key={s.id}
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: i * 0.05 }}
                     className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden h-full flex flex-col pt-8"
                   >
                      <div className="flex gap-4 items-start mb-4">
                         <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20 z-10 relative overflow-hidden">
                               {s.imageUrl ? (
                                 <Image 
                                   src={s.imageUrl} 
                                   alt={s.name} 
                                   fill 
                                   className="object-cover"
                                 />
                               ) : (
                                 s.name?.charAt(0) || "U"
                               )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full z-20"></div>
                         </div>
                         <div className="flex-1">
                            <h3 className="font-bold text-lg font-cabin">{s.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                               <Badge variant="outline" className="text-[10px] uppercase tracking-tighter bg-zinc-50 dark:bg-zinc-800 py-0.5 border-none font-bold text-zinc-600 dark:text-zinc-400">
                                  {s.level} Level
                               </Badge>
                               {s.role === 'FACULTY REP' && (
                                  <Badge className="text-[10px] uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-none font-bold py-0.5">
                                     Faculty Rep
                                  </Badge>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Interests / Skills tags */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                         {(s.interests || "Expert").split(',').map((tag: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-2.5 py-1 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 rounded-full font-medium border border-blue-100/50 dark:border-blue-900/20 whitespace-nowrap uppercase tracking-tighter">
                               {tag.trim()}
                            </span>
                         ))}
                      </div>

                      <div className="flex gap-2 mt-auto pt-8">
                         <button 
                           onClick={() => {
                             if (isAspirant) return setShowUpgradeModal(true);
                             toast.info("Messaging is coming soon!");
                           }} 
                           className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                         >
                           <MessageCircle className="w-4 h-4 text-blue-600" /> Chat
                         </button>
                         <button 
                           disabled={s.connectionStatus === "PENDING" || s.connectionStatus === "ACCEPTED"}
                           onClick={() => {
                             if (isAspirant) return setShowUpgradeModal(true);
                             setSelectedPeer(s);
                             setShowConnectModal(true);
                           }} 
                           className={`flex-1 font-bold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md ${s.connectionStatus === "PENDING" ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none" : s.connectionStatus === "ACCEPTED" ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-none" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"}`}
                         >
                            {s.connectionStatus === "PENDING" ? (
                               <><Clock className="w-4 h-4" /> Pending</>
                            ) : s.connectionStatus === "ACCEPTED" ? (
                               <><UserCheck className="w-4 h-4" /> Linked</>
                            ) : (
                               <><UserPlus className="w-4 h-4" /> Connect</>
                            )}
                         </button>
                      </div>
                   </motion.div>
                 ))
               )}
            </div>

            {/* Q&A / Community Feed Overhaul */}
            <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-bold font-cabin tracking-tight">Community Mentorship Feed</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-light">See what students are discussing in your community.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> LIVE UPDATES
                    </span>
                 </div>
               </div>
               
               {/* Community Input - Unified for Aspirant and Student */}
               <form onSubmit={handlePostSubmit} className="mb-8 relative group">
                  <Input 
                    placeholder="Ask a question or share an academic tip..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="h-16 rounded-3xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 pr-16 focus-visible:ring-blue-500 transition-all font-poppins text-sm px-6"
                    disabled={isPosting}
                  />
                  <button 
                    disabled={!newPostContent.trim() || isPosting}
                    className="absolute right-2 top-2 bottom-2 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:bg-zinc-400"
                  >
                    {isPosting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
               </form>

               <div className="space-y-6 relative z-10 transition-all">
                  {postsToMap.length === 0 ? (
                    <div className="py-20 text-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-100 dark:border-zinc-800">
                       <MessageCircle className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                       <h4 className="font-bold text-lg font-cabin">No discussions yet</h4>
                       <p className="text-zinc-400 text-xs mt-1">Be the first to start a conversation in your department!</p>
                    </div>
                  ) : (
                    postsToMap.map((post: any, idx: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={post.id} 
                        className={`p-6 rounded-3xl border transition-all ${idx >= 4 && isAspirant ? "blur-[2px] opacity-40 select-none pointer-events-none" : "hover:border-blue-200 bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800 shadow-sm"}`}
                      >
                         <div className="flex gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                              {post.authorName?.charAt(0) || "U"}
                            </div>
                            <div>
                               <div className="font-bold text-sm font-cabin flex items-center gap-2">
                                 {post.authorName} 
                                 <Badge className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-0 border-none">
                                    {post.authorLevel} UNIT
                                 </Badge>
                               </div>
                               <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(post.createdAt))} ago
                               </div>
                            </div>
                         </div>
                         <p className="font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed text-[15px]">{post.content}</p>
                      </motion.div>
                    ))
                  )}
               </div>
               
               {/* Smart Blur & Upsell for Aspirants */}
               {isAspirant && postsToMap.length > 4 && (
                 <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white dark:from-zinc-900 via-white/90 dark:via-zinc-900/90 to-transparent flex items-end justify-center pb-12 z-20 px-8">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-700 max-w-sm text-center space-y-4">
                       <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-inner">
                          <Lock className="w-6 h-6" />
                       </div>
                       <h3 className="text-lg font-bold font-cabin transition-all">Join the Conversation</h3>
                       <p className="text-xs text-zinc-500 font-light leading-snug">
                          Verified students can participate in deep-dive discussions and message mentors directly.
                       </p>
                       <button onClick={() => setShowUpgradeModal(true)} className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-[1.02] transition-all">
                          Get Verified Access
                       </button>
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* Sidebar Navigation */}
         <div className="lg:col-span-4 space-y-8">
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative group">
               <div className="relative z-10 space-y-6">
                 <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md">
                    <UsersIcon className="w-6 h-6 text-blue-400" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="font-bold text-2xl font-cabin tracking-tight">Active Circles</h3>
                    <p className="text-zinc-400 text-sm font-light leading-relaxed">Join specialized study groups and social circles organized by department reps.</p>
                 </div>
                 
                 <div className="space-y-3">
                   {['Core Tech Stack Review', 'Faculty Engineering 101', 'Finalist Job Pipeline'].map((g, i) => (
                     <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all group/item" onClick={() => isAspirant ? setShowUpgradeModal(true) : alert("Coming soon")}>
                        <span className="font-semibold text-xs tracking-tight group-hover/item:text-blue-400">{g}</span>
                        {isAspirant ? <Lock className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronRight className="w-4 h-4 text-zinc-400 group-hover/item:translate-x-1 transition-transform" />}
                     </div>
                   ))}
                 </div>
                 
                 <button className="w-full bg-white text-black font-bold py-4 rounded-3xl text-sm mt-4 hover:shadow-blue-500/20 shadow-xl transition-all">
                    Explore All Groups
                 </button>
               </div>

               {/* Decorative Gradient Blob */}
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/30 transition-all"></div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[2.5rem] p-8 space-y-6">
               <h3 className="text-lg font-bold font-cabin flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" /> Community News
               </h3>
               {[
                 "Maths 101 Discussion is trending",
                 "New mentor joined Engineering department",
                 "Post-UTME prep session starting in 2h"
               ].map((item, i) => (
                 <div key={i} className="flex gap-4 items-start group cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-light group-hover:text-blue-600 transition-colors">{item}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <ConnectionRequestModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)} 
        targetStudent={selectedPeer}
        onSuccess={refreshData}
      />
    </div>
  );
}

