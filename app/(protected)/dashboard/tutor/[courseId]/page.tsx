"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, Bot, User, Sparkles, BookOpen, Loader2, Info } from "lucide-react";
import { askAiTutor } from "@/actions/tutor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CourseTutorPage() {
  const { courseId } = useParams() as { courseId: string };
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Hello! I'm your AI tutor for this course. I've analyzed the recommended materials and past questions. How can I help you study today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const result = await askAiTutor(courseId, newMessages);
      
      if (result.success) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: result.data,
          sources: result.sources 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Sorry, I encountered an error: " + (result.error || "Unknown error")
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm having trouble connecting to the brain right now. Please try again later." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 font-open-sans">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 shrink-0 flex items-center justify-between shadow-sm relative z-10">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
             </div>
             <div>
                <h2 className="font-bold font-cabin text-lg leading-tight tracking-tight">Academic AI Tutor</h2>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  RAG Engine Active
                </div>
             </div>
         </div>
         <button className="hidden sm:flex text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200/50 dark:border-zinc-700/50">
            <BookOpen className="w-4 h-4 text-indigo-500" /> Grounded in Materials
         </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 group ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                msg.role === "user" 
                ? "bg-indigo-600 text-white border-indigo-500" 
                : "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-zinc-200 dark:border-zinc-800"
              }`}>
                 {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed shadow-sm border transition-all ${
                  msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none border-indigo-500" 
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-tl-none text-zinc-800 dark:text-zinc-200"
                }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                      <ReactMarkdown 
                       remarkPlugins={[remarkGfm]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter mr-1">
                      <Info className="w-3 h-3" /> Sources:
                    </div>
                    {msg.sources.map((source: any, sIdx: number) => (
                      <div key={sIdx} className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 rounded-full text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                         {source.title} (p. {source.page})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
             <div className="flex gap-4 animate-in fade-in duration-300">
               <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 text-indigo-600 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                 <Bot className="w-5 h-5" />
               </div>
               <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  <span className="ml-2 text-xs font-medium text-zinc-400">Thinking...</span>
               </div>
             </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
         <div className="max-w-4xl mx-auto relative group">
            <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200`}></div>
            <div className="relative flex gap-3 items-center bg-white dark:bg-zinc-950 rounded-[1.75rem] p-2 pl-6 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-indigo-500/5">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a specific question about these course materials..."
                  className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-zinc-400 h-12"
                  disabled={isTyping}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
                >
                  {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 translate-y-[1px] -translate-x-[1px]" />}
                </button>
            </div>
         </div>
         <p className="text-center text-[10px] text-zinc-400 mt-4 font-medium uppercase tracking-widest">
           Powered by UniVault Academic Core
         </p>
      </div>
    </div>
  );
}
