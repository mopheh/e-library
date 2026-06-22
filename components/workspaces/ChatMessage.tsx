"use client";

import React from "react";
import { User, Bot } from "lucide-react";
import AIResponse from "@/components/Dashboard/Response";
import { convertToMarkdownMath } from "@/lib/utils";
import { Message } from "./types";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
          ? "bg-gradient-to-br from-blue-500 to-violet-600"
          : "bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800"
          }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-zinc-650 dark:text-zinc-300" />
        )}
      </div>

      <div
        className={`flex-1 max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${isUser
          ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm ml-auto font-poppins"
          : "bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-100 rounded-tl-sm"
          }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-xs dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 font-poppins">
            <AIResponse markdown={convertToMarkdownMath(message.content)} />
          </div>
        )}
      </div>
    </div>
  );
};
