"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Send,
  Bot,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  ZapOff,
  GraduationCap,
  Brain,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

// Restructured components, constants, and types
import { WorkspaceBook, Message } from "@/components/workspaces/types";
import { BookMaterialCard, TYPE_CONFIG, FALLBACK_CONFIG } from "@/components/workspaces/BookMaterialCard";
import { ChatMessage } from "@/components/workspaces/ChatMessage";

const SUGGESTED_QUESTIONS = [
  "Summarize the key topics in this course",
  "What are the most important concepts I should know for the exam?",
  "Give me 5 practice questions from the past questions",
  "Explain the hardest topic in this course simply",
];

export default function CourseWorkspacePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { data: workspace, isLoading, error } = useWorkspace(courseId);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Derived state
  const allTypes = workspace
    ? ["All", ...Object.keys(workspace.materialsByType)]
    : ["All"];
  const displayedBooks =
    workspace && activeTab !== "All"
      ? workspace.materialsByType[activeTab] || []
      : workspace?.books || [];

  const handleSend = async (msgContent?: string) => {
    const text = msgContent ?? input.trim();
    if (!text || aiLoading) return;
    setInput("");
    setAiError(null);

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          courseId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err: any) {
      setAiError(err.message || "Failed to get AI response");
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-zinc-500 text-xs font-medium font-poppins">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center px-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-poppins">
          Workspace not found
        </h2>
        <p className="text-sm text-zinc-500 font-poppins">
          {(error as Error)?.message || "This course workspace could not be loaded."}
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-poppins"
        >
          <ChevronLeft className="w-4 h-4" />
          Go back
        </button>
      </div>
    );
  }

  const { course, stats } = workspace;

  return (
    <div className="min-h-screen pb-24">
      {/* Breadcrumb */}
      <div className="pt-2 pb-4">
        <button
          onClick={() => router.push("/workspaces")}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-poppins"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          All Workspaces
        </button>
      </div>

      {/* Course Header (Revamped Hero) */}
      <div className="mb-8">
        {/* Accent top bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-violet-500 to-cyan-500 rounded-full mb-6 opacity-60" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/60 rounded px-2 py-0.5 tracking-widest uppercase">
                {course.courseCode}
              </span>
              <span className="text-[10px] font-medium rounded-full px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-poppins">
                {course.level} Level
              </span>
              <span className="text-[10px] font-medium rounded-full px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-poppins">
                {course.semester} Semester
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white leading-tight mb-2 font-poppins">
              {course.title}
            </h1>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-poppins">
              <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
              {course.unitLoad} Unit Load
            </p>
          </div>

          {/* Stats strip using glass-card design */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 glass-card rounded-xl px-3.5 py-2">
              <div>
                <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{stats.totalBooks}</p>
                <p className="text-[9px] text-zinc-400 mt-0.5 font-poppins">Materials</p>
              </div>
            </div>
            <div className="flex items-center gap-2 glass-card rounded-xl px-3.5 py-2">
              <div>
                <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{stats.questionsCount}</p>
                <p className="text-[9px] text-zinc-400 mt-0.5 font-poppins">Questions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 glass-card rounded-xl px-3.5 py-2">
              <div className="flex items-center gap-1">
                {stats.aiReady ? (
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ZapOff className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">
                  {stats.aiReady ? "Ready" : "Pending"}
                </p>
              </div>
              <p className="text-[9px] text-zinc-400 mt-0.5 font-poppins">AI Context</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
        {/* Left: Materials */}
        <div className="flex flex-col gap-6">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-violet-600 rounded-full" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-poppins">
                Course Materials
              </h2>
            </div>
            <span className="text-[11px] text-zinc-450 font-poppins">
              {displayedBooks.length} resource{displayedBooks.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Type tabs */}
          {allTypes.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {allTypes.map((type) => {
                const config = TYPE_CONFIG[type] || FALLBACK_CONFIG;
                const isActive = activeTab === type;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all ${isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30"
                      : "bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800"
                      }`}
                  >
                    {type !== "All" && (
                      <config.icon className="w-3.5 h-3.5" />
                    )}
                    <span className="font-poppins">{type}</span>
                    <span
                      className={`text-[10px] font-bold ml-0.5 ${isActive ? "text-blue-100" : "text-zinc-400"}`}
                    >
                      {type === "All"
                        ? workspace.books.length
                        : (workspace.materialsByType[type]?.length ?? 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Materials grid */}
          {displayedBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center px-4 bg-white dark:bg-zinc-900/50">
              <BookOpen
                className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3"
                strokeWidth={1.5}
              />
              <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 mb-1 font-poppins">
                No {activeTab !== "All" ? activeTab : ""} materials yet
              </p>
              <p className="text-[11px] text-zinc-400 font-poppins">
                Materials uploaded to this course will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedBooks.map((book) => (
                <BookMaterialCard key={book.id} book={book} courseId={courseId} />
              ))}
            </div>
          )}

          {/* Link to CBT for this course */}
          {stats.questionsCount > 0 && (
            <Link
              href={`/cbt?courseId=${courseId}`}
              className="flex items-center justify-between p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100/50 dark:hover:bg-amber-950/20 transition-all duration-200 group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-poppins">
                    Practice with Past Questions
                  </p>
                  <p className="text-xs text-zinc-500 font-poppins">
                    {stats.questionsCount} MCQ questions available
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
            </Link>
          )}
        </div>

        {/* Right: AI Study Chat */}
        <div className="flex flex-col h-full">
          <div className="sticky top-4 flex flex-col gap-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-lg">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800/80 backdrop-blur-md">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 dark:text-white font-poppins">
                  AI Study Assistant
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-poppins">
                  {course.courseCode} · {stats.totalBooks} materials connected
                </p>
              </div>
              <div
                className={`flex items-center gap-1 text-[9px] font-semibold rounded-full px-2 py-0.5 ${stats.aiReady
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450"
                  : "bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
              >
                {stats.aiReady ? (
                  <Zap className="w-2.5 h-2.5" />
                ) : (
                  <ZapOff className="w-2.5 h-2.5" />
                )}
                {stats.aiReady ? "RAG Active" : "No Index"}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex flex-col gap-4 p-4 h-[460px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-6.5 h-6.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-poppins">
                      Ask anything about {course.courseCode}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-poppins leading-relaxed">
                      I&apos;ve read all {stats.totalBooks} materials in this workspace.
                      {stats.aiReady
                        ? " Semantic search is active."
                        : " Materials are still being indexed."}
                    </p>
                  </div>
                  {/* Suggested questions */}
                  <div className="w-full flex flex-col gap-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="w-full text-left text-xs text-zinc-650 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 rounded-xl px-3 py-2.5 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <ChatMessage key={i} message={m} />
                  ))}
                  {aiLoading && (
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-zinc-650 dark:text-zinc-300" />
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  {aiError && (
                    <div className="flex items-center gap-2 text-[11px] text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 font-poppins font-poppins">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {aiError}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Ask about ${course.courseCode}...`}
                  rows={2}
                  className="flex-1 resize-none text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-450 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || aiLoading}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm shadow-blue-500/30"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <p className="text-[9px] text-zinc-400 mt-1.5 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
