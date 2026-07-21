"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import AIResponse from "@/components/Dashboard/Response";
import { FiSend } from "react-icons/fi";
import { convertToMarkdownMath } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ShieldOff, Clock } from "lucide-react";

interface AIChatAssistantProps {
  pageNumber?: number;
  getPageImage?: () => string | null;
  title?: string;
  bookId?: string;
  courseId?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

// Classify a raw error from the AI SDK into one of three UI states.
type AIErrorKind = "rate_limited" | "disabled" | "other";

function classifyError(err: Error | undefined): AIErrorKind | null {
  if (!err) return null;
  const msg = err.message ?? "";
  // 429 daily limit
  if (msg.includes("daily limit") || msg.includes("Too many requests")) return "rate_limited";
  // 403 disabled (platform-wide or per-user)
  if (msg.includes("disabled") || msg.includes("AI access")) return "disabled";
  return "other";
}

function AIErrorBanner({ kind, message }: { kind: AIErrorKind; message: string }) {
  if (kind === "rate_limited") {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 h-full">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-amber-500 dark:text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Daily Limit Reached
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[220px] leading-relaxed">
          {message || "You have used up your AI requests for today. Come back tomorrow to keep studying!"}
        </p>
        <span className="mt-4 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full">
          Resets at midnight
        </span>
      </div>
    );
  }

  if (kind === "disabled") {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 h-full">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mb-4">
          <ShieldOff className="w-7 h-7 text-rose-500 dark:text-rose-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          AI Temporarily Unavailable
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[220px] leading-relaxed">
          The AI assistant has been turned off by your administrator. Please check back later or contact support.
        </p>
      </div>
    );
  }

  // Generic fallback
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 h-full">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-2xl">
        ⚠️
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
        Something went wrong
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[220px] leading-relaxed">
        {message || "An unexpected error occurred. Please try again."}
      </p>
    </div>
  );
}

export default function AIChatAssistant({
  pageNumber,
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
      pageNumber,
      get pageImage() { return getPageImage ? getPageImage() : null; }
    }
  }), [bookId, courseId, getPageImage, pageNumber]);

  const { messages, status, error, sendMessage } = useChat({
    transport,
    messages: [],
  });

  const isLoading = status === "streaming" || status === "submitted";
  const errorKind = classifyError(error);

  // Input is blocked when loading or when limit/disabled errors apply
  const isBlocked = isLoading || errorKind === "rate_limited" || errorKind === "disabled";

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

  // Header status indicator
  const headerStatus = errorKind === "rate_limited"
    ? { dot: "bg-amber-500", label: "Limit reached" }
    : errorKind === "disabled"
    ? { dot: "bg-rose-500", label: "Unavailable" }
    : isLoading
    ? { dot: "bg-amber-500 animate-pulse", label: "Thinking..." }
    : { dot: "bg-emerald-500", label: "Online" };

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
            <span className={`w-1.5 h-1.5 rounded-full ${headerStatus.dot}`} />
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {headerStatus.label}
            </p>
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm scroll-smooth"
      >
        {/* Error states take over the whole chat area */}
        {errorKind && messages.length === 0 && (
          <AIErrorBanner kind={errorKind} message={error?.message ?? ""} />
        )}

        {/* If there are prior messages, show them then show the error inline at the bottom */}
        {messages
          .filter((m) => m.role !== "system")
          .map((msg) => {
            // A turn can arrive as more than one "text" part (e.g. split across
            // stream segments); guard against a part being byte-identical to the
            // one right before it so the same paragraph never renders twice.
            const textParts = (msg.parts?.filter((p: any) => p.type === "text") ?? []) as { text: string }[];
            const content = textParts
              .filter((p, i) => i === 0 || p.text !== textParts[i - 1].text)
              .map((p) => p.text)
              .join("\n");
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

        {/* Inline error banner shown after prior messages */}
        {errorKind && messages.length > 0 && (
          <div className="flex justify-start">
            <div className={`rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] shadow-sm border text-[13px] leading-relaxed flex items-start gap-3 ${
              errorKind === "rate_limited"
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                : errorKind === "disabled"
                ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
            }`}>
              {errorKind === "rate_limited" && <Clock className="w-4 h-4 shrink-0 mt-0.5" />}
              {errorKind === "disabled" && <ShieldOff className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>
                {errorKind === "rate_limited"
                  ? "You have reached your daily AI request limit. Come back tomorrow!"
                  : errorKind === "disabled"
                  ? "The AI assistant is currently unavailable. Your admin has turned it off."
                  : (error?.message || "Something went wrong. Please try again.")}
              </span>
            </div>
          </div>
        )}

        {/* Empty state (no messages, no error) */}
        {messages.length === 0 && !isLoading && !errorKind && (
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

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
           <div className="flex justify-start">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-zinc-100 dark:border-zinc-800 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={containerRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        {/* Hint strip shown when blocked by a known error */}
        {(errorKind === "rate_limited" || errorKind === "disabled") && (
          <p className="text-[10px] text-center mb-2 font-medium px-2 py-1 rounded-lg
            text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
          >
            {errorKind === "rate_limited"
              ? "Daily limit reached. Resets at midnight."
              : "AI is currently unavailable."}
          </p>
        )}
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
            className="flex-1 pl-4 pr-12 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-950 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm dark:text-white placeholder:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={
              errorKind === "rate_limited"
                ? "Daily limit reached..."
                : errorKind === "disabled"
                ? "AI is currently unavailable..."
                : "Ask a question..."
            }
            disabled={isBlocked}
            />
            <button
            type="submit"
            disabled={!input?.trim() || isBlocked}
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
