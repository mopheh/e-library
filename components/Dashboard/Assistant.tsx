"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import AIResponse from "@/components/Dashboard/Response";
import { FiSend } from "react-icons/fi";
import { convertToMarkdownMath } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface AIChatAssistantProps {
  pageText?: string;
  getPageImage?: () => string | null;
  title?: string;
  bookId?: string;
  courseId?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

export default function AIChatAssistant({
  pageText,
  getPageImage,
  title = "Study Assistant",
  bookId,
  courseId,
  inputValue = "",
  onInputChange,
}: AIChatAssistantProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(inputValue || "");

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/ask",
    body: {
      bookId,
      courseId,
      get pageImage() { return getPageImage ? getPageImage() : null; }
    }
  }), [bookId, courseId, getPageImage]);

  const { messages, status, sendMessage } = useChat({
    transport,
    messages: [],
  });

  const isLoading = status === "streaming" || status === "submitted";

  const getMessageText = (msg: (typeof messages)[number]) =>
    msg.parts
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (inputValue !== input) {
      setInput(inputValue);
    }
  }, [inputValue, setInput]);

  // Auto scroll logic
  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom(false);
    }
  }, [messages, isLoading]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ text: input });

    setInput("");
    if (onInputChange) onInputChange("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    if (onInputChange) onInputChange(suggestion);
    
    sendMessage({ text: suggestion });
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-[#0b141a]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
          🤖
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{title}</h2>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {isLoading ? "Thinking..." : "Online"}
            </p>
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm scroll-smooth"
      >
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
             <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-2xl">
                👋
             </div>
             <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">How can I help you study?</h3>
             <p className="text-xs text-zinc-500 max-w-[200px] mb-6">Ask questions about the current page to get instant answers.</p>
             
             <div className="flex flex-wrap justify-center gap-2">
                {["Summarize this page", "Key concepts", "Explain the first paragraph"].map((suggestion) => (
                    <button 
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300"
                    >
                        {suggestion}
                    </button>
                ))}
             </div>
          </div>
        )}

        {messages
          .filter((m) => m.role !== "system")
          .map((msg) => {
            const content = msg.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n') || '';
            return (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm text-[13px] leading-relaxed break-words overflow-hidden ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-100 dark:border-zinc-800"
                }`}
              >
                <AIResponse
                  markdown={
                    msg.role === "assistant"
                      ? convertToMarkdownMath(content)
                      : content
                  }
                />
              </div>
            </div>
            );
          })}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
           <div className="flex justify-start">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-zinc-100 dark:border-zinc-800 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}

        <div ref={containerRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 relative"
        >
            <input
            type="text"
            value={input}
            onChange={(e) => {
              handleInputChange(e);
              if (onInputChange) onInputChange(e.target.value);
            }}
            className="flex-1 pl-4 pr-12 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-950 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm dark:text-white placeholder:text-zinc-400"
            placeholder="Ask a question..."
            disabled={isLoading}
            />
            <button
            type="submit"
            disabled={!input?.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-50 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 transition-colors hover:bg-indigo-700 shadow-sm"
            >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <FiSend size={16} />
            )}
            </button>
        </form>
      </div>
    </div>
  );
}
