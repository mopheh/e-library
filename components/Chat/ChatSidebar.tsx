"use client";

import React, { useState, useEffect } from "react";
import { Bot, MessageCircle, User, Loader2, Minimize2, Maximize2, X, ChevronRight } from "lucide-react";
import { getChatRooms } from "@/actions/chat";
import ChatWindow from "./ChatWindow";
import { motion, AnimatePresence } from "framer-motion";
import { useUserData } from "@/hooks/useUsers";

export default function ChatSidebar() {
    const { data: userData } = useUserData();
    const currentUserId = userData?.id;
    const [isOpen, setIsOpen] = useState(false);
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadRooms();
        }
    }, [isOpen]);

    const loadRooms = async () => {
        setIsLoading(true);
        const res = await getChatRooms();
        if (res.success) {
            setRooms(res.data || []);
        }
        setIsLoading(false);
    };

    const activeRoom = rooms.find(r => r.id === activeRoomId);

    return (
        <>
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl items-center justify-center transition-all z-[60] group active:scale-95"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-[60] font-poppins"
                    >
                        {activeRoomId ? (
                            /* Active Chat Window */
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
                                    <button 
                                        onClick={() => setActiveRoomId(null)}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to list
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Grounded Session</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0">
                                    {currentUserId ? (
                                        <ChatWindow 
                                            roomId={activeRoomId} 
                                            currentUserId={currentUserId} 
                                            otherUserName={activeRoom?.otherUser?.fullName || "Chat"} 
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Room List */
                            <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
                                <div className="p-8 pb-4">
                                    <h2 className="text-2xl font-bold font-cabin text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                                        Messages <div className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">{rooms.length}</div>
                                    </h2>
                                    <p className="text-xs text-zinc-500 mt-1">Connect with your peers in real-time.</p>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 pb-4">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        </div>
                                    ) : rooms.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 border-dashed">
                                            <p className="text-sm font-medium text-zinc-400">No active conversations yet.</p>
                                            <p className="text-[10px] text-zinc-500 mt-1">Connect with more people to start chatting.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {rooms.map((room) => (
                                                <button 
                                                    key={room.id}
                                                    onClick={() => setActiveRoomId(room.id)}
                                                    className="w-full p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all group text-left"
                                                >
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                                                        {room.otherUser.fullName?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{room.otherUser.fullName}</h4>
                                                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                        <p className="text-xs text-zinc-500 truncate">
                                                            {room.lastMessage?.content || "No messages yet"}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-center">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">UniVault Messaging</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
