// components/AIChatAssistant.tsx
"use client";
import { useState } from "react";
import AIResponse from "@/components/Dashboard/Response";
import { FiSend } from "react-icons/fi";
import { useRef, useEffect } from "react";
import { convertToMarkdownMath } from "@/lib/utils";

interface AIChatAssistantProps {
  pageText?: string;
}

export default function AIChatAssistant({ pageText }: AIChatAssistantProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    // @ts-ignore
    setMessages((prev) => [...prev, userMessage]);

    const hasContent = pageText && pageText.trim().length > 0;

    const systemMessage = {
      role: "system",
      content: hasContent
        ? `You are a helpful study assistant. The student is reading the following textbook content:\n\n"${pageText}".\n\nAnswer the student's question using only this content.`
        : `You are a helpful study assistant, but the textbook page is currently empty. Politely ask the student to share a clearer page or rephrase their question.`,
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
      // @ts-ignore
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Simulate typing delay
      let index = 0;
      const fullResponse = data.response;

      const typeInterval = setInterval(() => {
        // @ts-ignore
        setMessages((prev) => {
          const last = prev.at(-1);
          const updated = [
            ...prev.slice(0, -1),
            {
              // @ts-ignore
              ...last!,
              content: fullResponse.slice(0, index),
            },
          ];
          return updated;
        });

        index += 10;
        if (index > fullResponse.length) clearInterval(typeInterval);
      }, 10);
    } catch (error) {
      console.error("Error sending message", error);
    }

    setLoading(false);
  };

  return (
    <div className="w-[40%] h-full flex flex-col bg-white p-4">
      <h2 className="text-lg font-bold mb-3 font-cabin">Study Assistant</h2>

      {/* Chat container */}
      <div className="flex-1 overflow-y-auto border rounded p-2 mb-2 space-y-2 text-xs">
        {messages
          .filter((m) => m.role !== "system")
          .map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold">
                  A
                </div>
              )}

              <div
                className={`p-2 my-1 rounded-md max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-green-100 text-right"
                    : "bg-white text-left"
                }`}
              >
                <div className="font-poppins whitespace-pre-wrap break-words">
                  <AIResponse markdown={convertToMarkdownMath(msg.content)} />
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold">
                  U
                </div>
              )}
            </div>
          ))}
        {loading && (
          <div className="flex items-center text-green-600 text-9xl animate-pulse">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        )}
        {/* Anchor for scroll-to-bottom */}
        <div ref={containerRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border rounded-full px-4 py-2 flex-1 text-sm"
          placeholder="Ask a question..."
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded-full text-base font-poppins"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}
