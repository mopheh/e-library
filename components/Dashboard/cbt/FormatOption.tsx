import React from "react";
import { InlineMath, BlockMath } from "react-katex";

export function renderOptionText(text: string) {
  const trimmed = text.trim();

  if (/^\\\[.*\\\]$/.test(trimmed)) {
    return <BlockMath math={trimmed.slice(2, -2)} />;
  }

  if (/^\\\(.*\\\)$/.test(trimmed)) {
    return <InlineMath math={trimmed.slice(2, -2)} />;
  }

  return <span>{text}</span>;
}
