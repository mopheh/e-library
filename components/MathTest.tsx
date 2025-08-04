// pages/math-test.tsx or inside a component
"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
export function sanitizeMath(text: string) {
  return text
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, expr) => `\\[${expr.trim()}\\]`) // Block math
    .replace(/\$(?!\$)(.+?)\$/g, (_, expr) => `\\(${expr.trim()}\\)`) // Inline math
    .replace(/\\\\/g, "\\"); // Clean double slashes
}
export function convertLaTeXBracketsToDollars(markdown: string) {
  return markdown.replace(
    /\\\[(.*?)\\\]/gs,
    (_, expr) => `$$\n${expr.trim()}\n$$`,
  );
}
export function cleanMarkdownMath(raw: string): string {
  return (
    raw
      // Convert double backslashes (\\) to single ones (\) for LaTeX rendering
      .replace(/\\\\/g, "\\")
      // Ensure block math is on its own line with double dollar signs
      .replace(
        /\$\$\s*(.*?)\s*\$\$/gs,
        (_, content) => `$$\n${content.trim()}\n$$`,
      )
      // Trim whitespace from the whole markdown
      .trim()
  );
}
function convertToMarkdownMath(input: string): string {
  return (
    input
      // Inline math: \( ... \)  =>  $...$
      .replace(/\\\((.*?)\\\)/g, (_, expr) => `$${expr.trim()}$`)
      // Block math: \[ ... \]  =>  $$...$$
      .replace(/\\\[(.*?)\\\]/gs, (_, expr) => `$$${expr.trim()}$$`)
  );
}

const markdown = String.raw`
### Problem:
Find the Laplace transform of \( f(t) = t e^{-5t} \).

### Solution:
The Laplace transform of \( f(t) = t e^{-5t} \) is:
\[
\boxed{F(s) = \frac{1}{(s + 5)^2}}
\]

### Derivation:
1. Key property: \( t^n e^{-at} \) → \( n!/(s+a)^{n+1} \)
2. For \( n=1, a=5 \):
\[
\mathcal{L}\{t e^{-5t}\} = \frac{1}{(s+5)^2}
\]
`;
console.log(convertToMarkdownMath(markdown));
export default function MathTest() {
  return (
    <div className="p-6 max-w-2xl mx-auto text-base">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {convertToMarkdownMath(markdown)}
      </ReactMarkdown>
    </div>
  );
}
