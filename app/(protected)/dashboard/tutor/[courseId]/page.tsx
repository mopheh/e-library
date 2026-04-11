"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, Bot, User, Sparkles, BookOpen, Loader2 } from "lucide-react";

export default function CourseTutorPage() {
  const { courseId } = useParams() as { courseId: string };
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your AI tutor for this course. I've analyzed the recommended materials and past questions. How can I help you study today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
       setMessages(prev => [...prev, { 
         role: "assistant", 
         content: "This is a simulated AI response. In the full implementation, I would generate a contextual answer based on the textbooks and past questions associated with this specific course. Keep up the great work studying!" 
       }]);
       setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 font-open-sans">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 shrink-0 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
             </div>
             <div>
                <h2 className="font-bold font-poppins text-lg leading-tight">Course AI Tutor</h2>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Online and ready
                </div>
             </div>
         </div>
         <button className="hidden sm:flex text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
            <BookOpen className="w-4 h-4" /> View Sources
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"}`}>
               {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm shadow-sm"}`}>
               {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-3 max-w-3xl mr-auto">
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center shrink-0">
               <Bot className="w-4 h-4" />
             </div>
             <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
             </div>
           </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
         <div className="max-w-4xl mx-auto flex gap-2">
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 border border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-zinc-950 transition-all flex items-center shadow-sm">
               <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question about this course..."
                  className="bg-transparent border-none outline-none w-full text-sm placeholder:text-zinc-400"
               />
            </div>
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-md transition-transform active:scale-95 shrink-0"
            >
               <Send className="w-5 h-5 translate-y-[1px] -translate-x-[1px]" />
            </button>
         </div>
      </div>
    </div>
  );
}
