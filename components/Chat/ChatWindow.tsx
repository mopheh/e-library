"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages, sendMessage } from "@/actions/chat";
import { formatDistanceToNow } from "date-fns";
import Pusher from "pusher-js";

interface ChatWindowProps {
    roomId: string;
    currentUserId: string;
    otherUserName: string;
    otherUserImage?: string | null;
    currentUserImage?: string | null;
}

export default function ChatWindow({ roomId, currentUserId, otherUserName, otherUserImage, currentUserImage }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const fetchMessages = async () => {
            setIsLoading(true);
            const res = await getMessages(roomId);
            if (res.success) {
                setMessages(res.data || []);
            }
            setIsLoading(false);
        };

        fetchMessages();
    }, [roomId]);

    useEffect(() => {
        if (!roomId || !currentUserId) return;

        console.log("Initializing Pusher connection...");
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!pusherKey || !pusherCluster) {
            console.error("Pusher keys are missing from environment variables!");
            return;
        }

        const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
            authEndpoint: "/api/pusher/auth",
        });

        const channel = pusher.subscribe(`private-chat-room-${roomId}`);
        
        channel.bind("new-message", (data: any) => {
            console.log("Real-time message received:", data);
            setMessages((prev) => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
        });

        channel.bind("pusher:subscription_succeeded", () => {
            console.log("✅ Pusher: Connected to room", roomId);
        });

        channel.bind("pusher:subscription_error", (err: any) => {
            console.error("❌ Pusher: Subscription failed", err);
        });

        return () => {
            console.log("Cleaning up Pusher connection...");
            channel.unbind_all();
            pusher.unsubscribe(`private-chat-room-${roomId}`);
            pusher.disconnect();
        };
    }, [roomId, currentUserId]);

    useEffect(() => {
        if (scrollRef.current) {
             scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const content = input.trim();
        setInput("");
        setIsSending(true);

        // Optimistic update with a temporary ID
        const tempId = `temp-${Date.now()}`;
        const tempMsg = {
            id: tempId,
            content,
            senderId: currentUserId,
            createdAt: new Date().toISOString(), // Use ISO string for consistency
        };
        setMessages(prev => [...prev, tempMsg]);

        const res = await sendMessage(roomId, content);
        if (res.success) {
            // Replace optimistic message with the real one from server
            setMessages(prev => {
                // If Pusher already added the message, just remove the temp one
                if (prev.some(m => m.id === res.data.id)) {
                    return prev.filter(m => m.id !== tempId);
                }
                // Otherwise, replace the temp message with the real one
                return prev.map(m => m.id === tempId ? res.data : m);
            });
        } else {
            // Remove optimistic message and show error
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert("Failed to send message");
        }
        
        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 font-poppins">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden">
                    {otherUserImage ? (
                        <img src={otherUserImage} alt={otherUserName} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5" />
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{otherUserName}</h3>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 bg-zinc-50/50 dark:bg-zinc-950/50">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-xs text-zinc-400 font-medium">Loading history...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                            <Send className="w-8 h-8 text-zinc-300" />
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Start the conversation</h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Send a message to start your academic collaboration with {otherUserName}.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUserId;
                        const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                        
                        return (
                            <div 
                                key={msg.id} 
                                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 mb-1 ${!showAvatar ? "opacity-0" : "opacity-100"}`}>
                                    {isMe ? (
                                        currentUserImage ? (
                                            <img src={currentUserImage} alt="Me" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">ME</div>
                                        )
                                    ) : (
                                        otherUserImage ? (
                                            <img src={otherUserImage} alt={otherUserName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><User className="w-4 h-4" /></div>
                                        )
                                    )}
                                </div>

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                                    <div className={`p-3.5 rounded-[1.25rem] text-sm shadow-sm transition-all ${
                                        isMe 
                                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-br-none" 
                                        : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none"
                                    }`}>
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest opacity-40 px-1`}>
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex gap-2 items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-[1.5rem] p-1.5 pl-4 focus-within:ring-2 ring-blue-500/20 transition-all border border-transparent focus-within:border-zinc-200 dark:focus-within:border-zinc-700">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Message..."
                        className="bg-transparent border-none outline-none flex-1 text-sm h-10 placeholder:text-zinc-400 font-light"
                        disabled={isSending}
                    />
                    <Button 
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl w-10 h-10 p-0 shadow-xl active:scale-95 transition-all"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="mt-3 text-center">
                    <p className="text-[8px] text-zinc-400 uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-1.5">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Encrypted & Synchronized
                    </p>
                </div>
            </div>
        </div>
    );
}

