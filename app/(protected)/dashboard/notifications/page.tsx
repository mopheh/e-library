"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  UserPlus, 
  MessageSquare, 
  Check, 
  X, 
  Circle, 
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { respondToConnectionRequest } from "@/actions/connect";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [handledRequests, setHandledRequests] = useState<Record<string, "ACCEPTED" | "REJECTED">>({});

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleResponse = async (notificationId: string, connectionId: string, status: "ACCEPTED" | "REJECTED") => {
    // Optimistic / Rapid UI Update
    setHandledRequests(prev => ({ ...prev, [connectionId]: status }));
    
    try {
      const res = await respondToConnectionRequest(connectionId, status);
      if (res.success) {
        toast.success(status === "ACCEPTED" ? "Connection accepted!" : "Request declined");
        // No full fetchNotifs() here to keep it snappy, 
        // the labels below handle the persistent view.
      } else {
        toast.error(res.error || "Action failed");
        // Rollback on error
        setHandledRequests(prev => {
          const next = { ...prev };
          delete next[connectionId];
          return next;
        });
      }
    } catch (error) {
      toast.error("An error occurred");
      setHandledRequests(prev => {
        const next = { ...prev };
        delete next[connectionId];
        return next;
      });
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === "all") return true;
    if (activeFilter === "requests") return n.type === "CONNECTION_REQUEST";
    if (activeFilter === "system") return n.type === "SYSTEM";
    return true;
  });

  return (
    <div className="flex-1 p-4 md:p-10 pt-6 space-y-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen max-w-5xl mx-auto font-poppins">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">
             <Bell className="w-4 h-4" /> Notification Center
          </div>
          <h1 className="text-4xl font-bold font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">Stay Connected</h1>
          <p className="text-zinc-500 font-light text-sm">Manage your peer requests and platform updates in one place.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
           {["all", "requests", "system"].map((f) => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeFilter === f ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
              >
                 {f}
              </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full bg-zinc-200 dark:bg-zinc-900 animate-pulse rounded-3xl" />
             ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-zinc-400" />
             </div>
             <h3 className="text-xl font-bold font-cabin">Peace and Quiet</h3>
             <p className="text-zinc-500 text-sm mt-2">You don't have any notifications in this category yet.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((notif) => {
              const handleStatus = handledRequests[notif.targetId || ""];
              
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative group bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border transition-all hover:shadow-xl hover:shadow-blue-500/5 ${notif.isRead ? "border-zinc-100 dark:border-zinc-800 opacity-80" : "border-blue-100 dark:border-blue-900/40 shadow-blue-500/10 shadow-sm"}`}
                >
                  {!notif.isRead && (
                    <div className="absolute top-6 left-2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  )}
                  
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                     <div className={`p-4 rounded-2xl shrink-0 ${notif.type === 'CONNECTION_REQUEST' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                        {notif.type === 'CONNECTION_REQUEST' ? (
                          handleStatus === 'ACCEPTED' ? <UserCheck className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />
                        ) : <Zap className="w-6 h-6" />}
                     </div>

                     <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                             <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter bg-zinc-100 dark:bg-zinc-800 border-none">
                                   {notif.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                   <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                </span>
                             </div>
                             <p className="text-zinc-900 dark:text-zinc-100 font-medium text-lg leading-tight font-cabin pt-1">
                                {handleStatus === 'ACCEPTED' ? `You are now connected with ${notif.message.split(' ')[0]}` : notif.message}
                             </p>
                          </div>
                        </div>

                        {notif.type === 'CONNECTION_REQUEST' && notif.targetId && (
                           <div className="flex items-center gap-3 pt-4">
                             {handleStatus === 'ACCEPTED' ? (
                               <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-4 py-2 rounded-xl border-none font-bold flex items-center gap-2">
                                 <Check className="w-4 h-4" /> Connected
                               </Badge>
                             ) : handleStatus === 'REJECTED' ? (
                               <Badge variant="outline" className="text-zinc-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border-zinc-200 dark:border-zinc-800">
                                 <X className="w-4 h-4" /> Request Declined
                               </Badge>
                             ) : (
                               <>
                                 <Button 
                                   onClick={() => handleResponse(notif.id, notif.targetId!, "ACCEPTED")}
                                   className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-500/20"
                                 >
                                    <Check className="w-4 h-4 mr-2" /> Accept Request
                                 </Button>
                                 <Button 
                                   variant="ghost" 
                                   onClick={() => handleResponse(notif.id, notif.targetId!, "REJECTED")}
                                   className="text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl px-6 font-bold"
                                 >
                                    <X className="w-4 h-4 mr-2" /> Decline
                                 </Button>
                               </>
                             )}
                           </div>
                        )}
                        
                        {notif.type === 'GENERAL' && (
                           <Link href="/dashboard/workspaces" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-2 group">
                              Check Activity <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                           </Link>
                        )}
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer / Tip */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
               <h3 className="text-2xl font-bold font-cabin tracking-tight">Expand Your Network</h3>
               <p className="text-blue-100 text-sm font-light max-w-md">
                 Each connection unlocks peer-to-peer messaging and collaborative study features. Verified reps are ready to help!
               </p>
            </div>
            <Link href="/connect">
               <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-2xl px-10 py-6 font-bold text-base shadow-xl group/btn">
                  Find More Peers <UserPlus className="ml-2 w-5 h-5 group-hover/btn:scale-110 transition-transform" />
               </Button>
            </Link>
         </div>
         <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all"></div>
      </div>
    </div>
  );
}
