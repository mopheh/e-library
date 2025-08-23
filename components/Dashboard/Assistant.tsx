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

export default function AIChatAssistant({ pageText, title = "Study Assistant" }: AIChatAssistantProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Auto scroll to bottom on new message
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading]);

    const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);

        const hasContent = pageText && pageText.trim().length > 0;

        const systemMessage = {
            role: "system",
            content: hasContent
                ? `You are a helpful study assistant. The student is reading the following textbook content:\n\n"${pageText}".\n\nAnswer the student's question using only this content.`
                : `You are a helpful study assistant, but the textbook page is currently empty. Politely ask the student to share a clearer page or rephrase their question or provide answer if you understand the context`,
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

                index += 3;
                if (index > fullResponse.length) clearInterval(typeInterval);
            }, 15);
        } catch (error) {
            console.error("Error sending message", error);
        }

        setLoading(false);
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#ece5dd] dark:bg-[#0b141a]">
            <div className="sticky top-0 z-10 flex items-center gap-3 px-3 py-2 bg-[#128C7E] dark:bg-[#202c33] text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    🤖
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold truncate">{title}</h2>
                    <p
                        className="text-[11px] leading-3 text-white/80"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {loading ? "typing…" : "online"}
                    </p>
                </div>
            </div>
            {/* Chat container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
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
                                className={`rounded-lg px-3 py-2 max-w-[75%] shadow text-[13px] leading-snug whitespace-pre-wrap break-words ${
                                    msg.role === "user"
                                        ? "bg-[#dcf8c6] dark:bg-emerald-800 dark:text-white text-black rounded-br-none"
                                        : "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100  rounded-bl-none"
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
                        <div className="bg-white rounded-lg rounded-bl-none px-3 py-2 shadow text-gray-500 animate-pulse">
                            typing...
                        </div>
                    </div>
                )}

                <div ref={containerRef} />
            </div>

            {/* Input bar (WhatsApp style) */}
            <form
                onSubmit={sendMessage}
                className="flex items-center gap-2 bg-white px-3 py-2 border-t dark:bg-gray-800  dark:border-gray-700"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-full bg-gray-100 focus:outline-none dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Type a message"
                />
                <button
                    type="submit"
                    className="bg-green-500 text-white p-2 rounded-full"
                >
                    <FiSend size={18} />
                </button>
            </form>
        </div>
    );
}
