import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";

export default function AIResponse({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        pre: ({ node, ...props }) => (
          <pre
            {...props}
            className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded text-sm overflow-x-auto font-mono whitespace-pre-wrap"
          />
        ),
        code: ({ node, ...props }) => (
          <code
            {...props}
            className="bg-zinc-200 dark:bg-zinc-900 px-1 py-0.5 rounded text-[0.85em] font-mono"
          />
        ),
        table: ({ node, ...props }) => (
          <table
            className="table-auto border-collapse border border-zinc-300 dark:border-zinc-800 text-xs my-2"
            {...props}
          />
        ),
        th: ({ node, ...props }) => (
          <th
            className="border border-zinc-300 dark:border-zinc-800 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-left"
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td
            className="border border-zinc-300 dark:border-zinc-700 px-2 py-1"
            {...props}
          />
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
