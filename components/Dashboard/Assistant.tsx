// components/AIChatAssistant.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import AIResponse from "@/components/Dashboard/Response";
import { FiSend } from "react-icons/fi";
import { convertToMarkdownMath } from "@/lib/utils";

interface AIChatAssistantProps {
  pageText?: string;
  title?: string;
}

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function AIChatAssistant({
  pageText,
  title = "Study Assistant",
}: AIChatAssistantProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref for the scrollable container (parent of messages)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll logic
  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    }
  };

  useEffect(() => {
    // Only scroll if we are seemingly at the bottom or it's a new interaction
    // A simple heuristic: if the AI is typing, force scroll, mostly. 
    // Ideally we check if user scrolled up, but for now let's just make it robust.
    scrollToBottom(true);
  }, [messages.length, loading]); // Scroll on new message count change or loading state change

  // For typing effect updates (which don't change message count, just content of last message)
  useEffect(() => {
    if (loading) {
        // Use a lighter scroll during rapid typing
        scrollToBottom(false);
    }
  }, [messages]); // This triggers heavily during typing, so we use auto scroll (instant) to avoid lag

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    const hasContent = pageText && pageText.trim().length > 0;

    const systemMessage = {
      role: "system",
      content: hasContent
        ? `You are a brilliant and helpful study tutor. The student is reading the following textbook content:\n\n"${pageText}".\n\nINSTRUCTIONS:\n1. Answer the student's question specifically using the provided content.\n2. Be detailed, step-by-step, and educational.\n3. FORMATTING: You MUST use LaTeX for ALL math equations. Use $...$ for inline math and $$...$$ for block math. Do NOT use [...] or (...).\n4. If the text contains problems, solve them completely showing all steps.\n5. If the question is general, answer it to the best of your ability using your knowledge, but prioritize the text.`
        : `You are a brilliant study tutor. The textbook page is currently not visible/empty. Politely ask the student to open a page or select text so you can help them better. If they ask a general question, answer it to the best of your ability, but mention you don't see the specific text.`,
    };

    const currentMessages = [systemMessage, ...messages, userMessage];

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ messages: currentMessages }),
      });

      const data = await res.json();

      // Add empty assistant message for typing effect
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Simulate typing effect
      let index = 0;
      const fullResponse = data.response;

      const typeInterval = setInterval(() => {
        setMessages((prev) => {
          const last = prev.at(-1);
          if (!last) return prev;
          const updated = [
            ...prev.slice(0, -1),
            { ...last, content: fullResponse.slice(0, index) },
          ];
          return updated;
        });

        index += 5; // Speed up typing slightly
        if (index > fullResponse.length) clearInterval(typeInterval);
      }, 10);
    } catch (error) {
      console.error("Error sending message", error);
    }

    setLoading(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-[#0b141a]">
      {/* Redesigned Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
          🤖
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{title}</h2>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {loading ? "Thinking..." : "Online"}
            </p>
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm scroll-smooth font-cabin"
      >
        {messages.length === 0 && !loading && (
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
                        onClick={() => {
                            setInput(suggestion);
                            // Optional: auto-send
                            // const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
                            // sendMessage(fakeEvent);
                        }}
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
          .map((msg, i) => (
            <div
              key={i}
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
                      ? convertToMarkdownMath(msg.content)
                      : msg.content
                  }
                />
              </div>
            </div>
          ))}

        {loading && (
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
            onSubmit={sendMessage}
            className="flex items-center gap-2 relative"
        >
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 pl-4 pr-12 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-950 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm dark:text-white placeholder:text-zinc-400"
            placeholder="Ask a question..."
            disabled={loading}
            />
            <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-50 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 transition-colors hover:bg-indigo-700 shadow-sm"
            >
            {loading ? (
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
