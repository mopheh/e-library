"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useUserData } from "@/hooks/useUsers";
import { getChatRooms } from "@/actions/chat";
import ChatWindow from "@/components/Chat/ChatWindow";
import { useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, Search, Inbox, ChevronLeft } from "lucide-react";

function MessagesPage() {
    const searchParams = useSearchParams();
    const queryRoomId = searchParams.get("roomId");
    
    const { data: userData } = useUserData();
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"list" | "chat">("list");

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const res = await getChatRooms();
            if (res.success) {
                setRooms(res.data || []);
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const activeRoom = rooms.find(r => r.id === activeRoomId);
    
    const filteredRooms = rooms.filter(room => 
        room.otherUser.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle deep-linking to a room
    useEffect(() => {
        if (queryRoomId && rooms.length > 0) {
            const targetRoom = rooms.find(r => r.id === queryRoomId);
            if (targetRoom) {
                setActiveRoomId(targetRoom.id);
                setView("chat");
            }
        }
    }, [queryRoomId, rooms]);

    const selectRoom = (id: string) => {
        setActiveRoomId(id);
        setView("chat");
    };

    if (!userData) return null;

    return (
        <div className="flex bg-white dark:bg-zinc-950 rounded-[2rem] sm:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] overflow-hidden shadow-2xl shadow-blue-500/5 font-poppins italic-none">
            
            {/* Sidebar List */}
            <div className={`w-full sm:w-80 border-r border-zinc-100 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/20 ${view === "chat" ? "hidden sm:flex" : "flex"}`}>
                <div className="p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-cabin flex items-center gap-2 uppercase tracking-tighter">
                        Inbox <Inbox className="w-5 h-5 text-blue-600" />
                    </h1>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                            type="text" 
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 ring-blue-500/20 transition-all outline-none font-poppins font-light"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loading Chats</span>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <p className="text-xs text-zinc-400 font-light font-poppins">No conversations found</p>
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() => selectRoom(room.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                                    activeRoomId === room.id 
                                    ? "bg-zinc-900 text-white shadow-xl dark:bg-zinc-50 dark:text-zinc-900" 
                                    : "hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                                    activeRoomId === room.id ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-cabin"
                                }`}>
                                    {room.otherUser.fullName?.charAt(0)}
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                    <h4 className="font-bold text-xs font-cabin truncate tracking-tight uppercase">{room.otherUser.fullName}</h4>
                                    <p className={`text-[10px] font-poppins font-light truncate opacity-70 mt-0.5`}>
                                        {room.lastMessage?.content || "No messages yet"}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 ${view === "list" ? "hidden sm:flex" : "flex"}`}>
                {activeRoomId ? (
                    <div className="h-full flex flex-col">
                        {/* Mobile Header Row */}
                        <div className="sm:hidden p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                             <button 
                                onClick={() => setView("list")}
                                className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700"
                             >
                                <ChevronLeft className="w-5 h-5 text-zinc-600" />
                             </button>
                             <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm font-cabin truncate tracking-tight">{activeRoom?.otherUser?.fullName}</h3>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online Now</p>
                             </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ChatWindow 
                                roomId={activeRoomId} 
                                currentUserId={userData.id} 
                                otherUserName={activeRoom?.otherUser?.fullName || "Chat"} 
                                otherUserImage={activeRoom?.otherUser?.imageUrl || null}
                                currentUserImage={userData.imageUrl || null}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 sm:p-20">
                        <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-800 rotate-12">
                            <MessageCircle className="w-10 h-10 text-zinc-400 -rotate-12" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-cabin uppercase tracking-tighter italic">No active session</h2>
                        <p className="text-xs text-zinc-500 mt-3 max-w-sm font-poppins font-light leading-relaxed">Select a peer from your inbox to start collaborating on materials and department news.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SafeMessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        }>
            <MessagesPage />
        </Suspense>
    );
}
