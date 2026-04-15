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
}

export default function ChatWindow({ roomId, currentUserId, otherUserName }: ChatWindowProps) {
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

        // Pusher Real-time subscription
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            userAuthentication: {
                endpoint: "/api/pusher/auth",
                transport: "ajax",
            },
        });

        const channel = pusher.subscribe(`private-chat-room-${roomId}`);
        
        channel.bind("new-message", (data: any) => {
            if (data.senderId !== currentUserId) {
                setMessages((prev) => [...prev, data]);
            }
        });

        return () => {
            pusher.unsubscribe(`private-chat-room-${roomId}`);
            pusher.disconnect();
        };
    }, [roomId, currentUserId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const content = input.trim();
        setInput("");
        setIsSending(true);

        // Optimistic update
        const tempMsg = {
            id: Math.random().toString(),
            content,
            senderId: currentUserId,
            createdAt: new Date(),
        };
        setMessages(prev => [...prev, tempMsg]);

        const res = await sendMessage(roomId, content);
        if (!res.success) {
            // Remove optimistic message or show error
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            alert("Failed to send message");
        }
        
        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 font-poppins">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{otherUserName}</h3>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-zinc-50/50 dark:bg-zinc-950/50">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-xs text-zinc-400 font-medium">Loading history...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Send className="w-8 h-8 text-zinc-300" />
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Start the conversation</h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Send a message to start your academic collaboration with {otherUserName}.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm transition-all ${
                                msg.senderId === currentUserId 
                                ? "bg-blue-600 text-white rounded-tr-none" 
                                : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                            }`}>
                                <p className="leading-relaxed">{msg.content}</p>
                                <p className={`text-[9px] mt-1 text-right  ${msg.senderId === currentUserId ? "text-blue-200" : "text-zinc-400"}`}>
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex gap-2 items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-1.5 pl-4 focus-within:ring-2 ring-blue-500/20 transition-all">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a message..."
                        className="bg-transparent border-none outline-none flex-1 text-sm h-10 placeholder:text-zinc-400"
                        disabled={isSending}
                    />
                    <Button 
                        onClick={handleSend}
                        disabled={!input.trim() || isSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-10 h-10 p-0 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="mt-2 text-center">
                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
                        <Info className="w-3 h-3" /> End-to-end synchronized via Pusher
                    </p>
                </div>
            </div>
        </div>
    );
}
