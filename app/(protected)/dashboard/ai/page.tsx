"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  BookOpen,
  Brain,
  Target,
  Lightbulb,
  GraduationCap,
  ChevronRight,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Zap,
  MessageSquare,
  User,
} from "lucide-react";
import { useUserData } from "@/hooks/useUsers";
import { useDashboard } from "@/hooks/useDashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

/* ─── Types ──────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/* ─── Prompt suggestions ─────────────────────────────────── */
const QUICK_PROMPTS = [
  {
    icon: GraduationCap,
    label: "Study Plan",
    prompt: "Create a 2-week study plan for my current courses including daily goals and revision strategies.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800/40",
  },
  {
    icon: Brain,
    label: "Exam Tips",
    prompt: "Give me proven techniques to prepare for university exams effectively, including memory strategies and time management.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800/40",
  },
  {
    icon: Target,
    label: "Set Goals",
    prompt: "Help me set SMART academic goals for this semester. Ask me about my courses and what I want to achieve.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
  {
    icon: BookOpen,
    label: "Summarize",
    prompt: "I want to understand a topic better. Start by asking me what subject or concept I want explained simply.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  {
    icon: Lightbulb,
    label: "Concept Help",
    prompt: "I'm struggling to understand something in my coursework. Ask me what concept I need help with.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800/40",
  },
  {
    icon: Zap,
    label: "Quick Facts",
    prompt: "Give me 5 important facts I should know about a topic. Ask me which subject to focus on.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-800/40",
  },
];

/* ─── Copy button ─────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ─── Message bubble ─────────────────────────────────────── */
function MessageBubble({ msg, userImageUrl }: { msg: Message; userImageUrl?: string }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn("flex gap-3 max-w-full", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <Avatar className="w-8 h-8 ring-2 ring-blue-200 dark:ring-blue-800">
            <AvatarImage src={userImageUrl} />
            <AvatarFallback className="bg-blue-600 text-white font-black text-xs">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={cn("group flex flex-col gap-1 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed font-poppins",
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/20"
              : "bg-white dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700 rounded-tl-sm shadow-sm"
          )}
        >
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:font-cabin prose-headings:tracking-tight prose-li:my-0.5">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className={cn("flex items-center gap-1", isUser ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[10px] text-zinc-400 font-poppins px-1">
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && <CopyButton text={msg.content} />}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Typing indicator ────────────────────────────────────── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, delay: i * 0.12, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function AIDashboardPage() {
  const { data: userData } = useUserData();
  const { data: dashData } = useDashboard();
  const { user } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isLoading) return;

      setInput("");
      setHasStarted(true);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Build context about the student
        const context = [
          userData?.fullName ? `Student name: ${userData.fullName}` : "",
          userData?.year ? `Level: ${userData.year}L` : "",
          dashData?.enrolledCourses?.length
            ? `Enrolled courses: ${dashData.enrolledCourses.map((c: any) => c.courseCode).join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join(". ");

        const systemContent = `You are an expert academic AI assistant for university students at the University of Benin. 
${context ? `Context about this student: ${context}.` : ""}
You help students with study planning, exam preparation, concept explanations, and academic success strategies.
Keep responses concise, practical, and encouraging. Use markdown formatting for better readability.
Always be warm, supportive, and tailored to Nigerian university students.`;

        // Build full messages array for the API
        const historyForAPI = [
          { role: "system" as const, content: systemContent },
          ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content },
        ];

        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyForAPI }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data = await response.json();
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response ?? data.reply ?? "I'm having trouble responding right now. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Sorry, I encountered an error. Please check your connection and try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, isLoading, messages, userData, dashData]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setHasStarted(false);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const greeting = userData?.fullName?.split(" ")[0] ?? user?.firstName ?? "Student";

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] font-poppins">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Study Assistant
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-zinc-400 font-medium">Online · Powered by Gemini</p>
            </div>
          </div>
        </div>

        {hasStarted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-[11px] font-bold font-cabin uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-2 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Chat
          </button>
        )}
      </div>

      {/* ── Chat area ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!hasStarted ? (
          /* Welcome state */
          <div className="flex flex-col items-center justify-center h-full p-6 max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative mb-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-2xl md:text-3xl font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                Hey {greeting} 👋
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                I&apos;m your personal AI academic assistant. Ask me anything about your courses, study strategies, or exam prep.
              </p>
            </motion.div>

            {/* Quick prompts grid */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="w-full mt-8 grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {QUICK_PROMPTS.map(({ icon: Icon, label, prompt, color, bg, border }) => (
                <button
                  key={label}
                  onClick={() => handleSend(prompt)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-2xl border text-left hover:scale-[1.02] active:scale-95 transition-all duration-200 group",
                    bg, border
                  )}
                >
                  <div className={cn("p-2 rounded-xl bg-white/60 dark:bg-zinc-900/60", border)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <div>
                    <p className={cn("text-xs font-black font-cabin uppercase tracking-wider", color)}>
                      {label}
                    </p>
                    <ChevronRight className={cn("w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity", color)} />
                  </div>
                </button>
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[11px] text-zinc-400 mt-6 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Or type your own question below ↓
            </motion.p>
          </div>
        ) : (
          /* Messages */
          <div className="flex flex-col gap-5 p-4 md:p-6 max-w-3xl mx-auto w-full">
            <AnimatePresence>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} userImageUrl={user?.imageUrl} />
              ))}
              {isLoading && <TypingIndicator key="typing" />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ──────────────────────────────────────── */}
      <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 md:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your studies…"
              rows={1}
              className="flex-1 resize-none bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 leading-relaxed min-h-[24px] max-h-32 overflow-y-auto font-poppins"
              style={{ scrollbarWidth: "none" }}
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                input.trim() && !isLoading
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 scale-100 hover:scale-105"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-400 mt-2 font-poppins">
            Press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">Enter</kbd> to send · <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
