"use client";

import React, { useState, useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import Pusher from "pusher-js";
import { Send, Users, ArrowLeft, Loader2, StickyNote, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function StudyRoomPage({ params }: { params: Promise<{ roomId: string, role: string }> }) {
  const { roomId, role } = use(params);
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [sharedNotes, setSharedNotes] = useState("## Welcome to the Study Room\n\nUse this space to paste important snippets, syllabus references, or quick summaries while you chat.");

  const { data: roomInfo, isLoading } = useQuery({
    queryKey: ["studyRoom", roomId],
    queryFn: async () => {
      const res = await fetch(`/api/study-rooms/${roomId}`);
      if (!res.ok) throw new Error("Failed to load room");
      return res.json();
    },
  });

  useEffect(() => {
    if (!user || !roomId) return;

    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    const channel = pusher.subscribe(`presence-room-${roomId}`);

    channel.bind("pusher:subscription_succeeded", (members: any) => {
      const users: any[] = [];
      members.each((member: any) => users.push(member.info));
      setOnlineUsers(users);
    });

    channel.bind("pusher:member_added", (member: any) => {
      setOnlineUsers((prev) => [...prev, member.info]);
    });

    channel.bind("pusher:member_removed", (member: any) => {
      setOnlineUsers((prev) => prev.filter((u) => u.name !== member.info.name));
    });

    channel.bind("new-message", (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      pusher.unsubscribe(`presence-room-${roomId}`);
      pusher.disconnect();
    };
  }, [user, roomId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const currentText = newMessage;
    setNewMessage("");

    // Optimistic UI update could go here, but waiting for server ensures ordering
    await fetch(`/api/study-rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: currentText }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!roomInfo || roomInfo.error) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="text-2xl font-bold font-poppins">Room Not Found</h2>
        <Link href={`/${role}/dashboard`} className="text-indigo-600 hover:underline mt-4 inline-block font-open-sans">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { room } = roomInfo;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href={`/${role}/dashboard/courses/${room.courseId}?tab=study-rooms`} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-poppins text-gray-900 dark:text-gray-50">{room.name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 font-open-sans">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Session • {room.description || "Discussing course materials"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center -space-x-2 mr-4">
            {onlineUsers.slice(0, 4).map((ou, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-indigo-700" title={ou.name}>
                {ou.name?.[0] || "?"}
              </div>
            ))}
            {onlineUsers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-gray-700">
                +{onlineUsers.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4" /> {onlineUsers.length} Online
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Shared Notes / Materials */}
        <div className="hidden md:flex flex-col w-1/2 lg:w-2/3 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold font-poppins">Shared Notes <span className="text-xs font-normal text-muted-foreground ml-2">(Coming in v2: Real-time syncing)</span></h3>
          </div>
          <div className="flex-1 p-4">
            <Textarea 
              value={sharedNotes}
              onChange={(e) => setSharedNotes(e.target.value)}
              className="w-full h-full min-h-full resize-none border-0 focus-visible:ring-0 p-4 text-base font-open-sans leading-relaxed bg-transparent"
              placeholder="Type shared notes here..."
            />
          </div>
        </div>

        {/* Right Side: Chat Box */}
        <div className="flex flex-col w-full md:w-1/2 lg:w-1/3 bg-gray-50/30 dark:bg-zinc-900/10">
          <ScrollArea className="flex-1 p-4 flex flex-col gap-4">
            <div className="space-y-4 pb-4">
              <div className="text-center my-6">
                 <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                   Room created {format(new Date(room.createdAt), 'MMM d, h:mm a')}
                 </span>
              </div>
              
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-10">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  Say hello to start the discussion!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.userId === user?.id;
                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-medium text-gray-500">{isMe ? "You" : msg.userName}</span>
                        <span className="text-[10px] text-gray-400">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-open-sans shadow-sm ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-zinc-700 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-gray-100 dark:bg-zinc-950 border-transparent focus-visible:ring-indigo-500 px-4"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newMessage.trim()} 
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
}
