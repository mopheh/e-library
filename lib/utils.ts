import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDocument } from "pdfjs-dist";
import B2 from "backblaze-b2";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const STORAGE_KEY = "recentlyViewedBooks";

export const addRecentlyViewedBook = (book: { id: string; progress: number }) => {
  if (!book?.id) return;

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const filtered = stored.filter((b: { id: string }) => b.id !== book.id); // avoid duplicates

  const updated = [book, ...filtered].slice(0, 5); // max 5 recent

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getRecentlyViewedBooks = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  console.log(stored);
  return stored ? JSON.parse(stored) : [];
};

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
// lib/utils.ts

export function resolvePdfLink(link: string): string {
  try {
    const url = new URL(link);

    if (url.hostname.includes("drive.google.com")) {
      return `/api/proxy-api?url=${encodeURIComponent(link)}`;
    }

    return link;
  } catch {
    return link;
  }
}

export const extractTextFromPage = async (
  pdfUrl: string,
  pageNum: number
): Promise<string> => {
  const loadingTask = getDocument(pdfUrl);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();
  interface TextItem {
    str: string;
  }
  return content.items.map((item: unknown) => (item as TextItem).str).join(" ");
};
export function getMostVisiblePage(container: HTMLDivElement): number | null {
  const pageContainers = Array.from(
    container.querySelectorAll(".rpv-core__page-container")
  ) as HTMLElement[];

  let maxVisibleArea = 0;
  let mostVisiblePage: number | null = null;
  const containerRect = container.getBoundingClientRect();

  pageContainers.forEach((pageEl, index) => {
    const rect = pageEl.getBoundingClientRect();

    const visibleWidth =
      Math.min(rect.right, containerRect.right) -
      Math.max(rect.left, containerRect.left);
    const visibleHeight =
      Math.min(rect.bottom, containerRect.bottom) -
      Math.max(rect.top, containerRect.top);

    const visibleArea = Math.max(0, visibleWidth) * Math.max(0, visibleHeight);

    if (visibleArea > maxVisibleArea) {
      maxVisibleArea = visibleArea;
      mostVisiblePage = index;
    }
  });

  return mostVisiblePage;
}
export function convertToMarkdownMath(input: string): string {
  if (!input) return "";

  let formatted = input;

  // 1. Replace double-escaped block brackets: \\\\[ ... \\\\]
  formatted = formatted.replace(/\\\\\[([\s\S]*?)\\\\\]/g, (_, equation) => {
    return `\n$$\n${equation.trim()}\n$$\n`;
  });

  // 2. Replace single-escaped block brackets: \\[ ... \\]
  formatted = formatted.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
    return `\n$$\n${equation.trim()}\n$$\n`;
  });

  // 3. Replace double-escaped inline parens: \\\\( ... \\\\)
  formatted = formatted.replace(/\\\\\(([\s\S]*?)\\\\\)/g, (_, equation) => {
    return `$${equation.trim()}$`;
  });

  // 4. Replace single-escaped inline parens: \\( ... \\)
  formatted = formatted.replace(/\\\(([\s\S]*?)\\\)/g, (_, equation) => {
    return `$${equation.trim()}$`;
  });

  return formatted;
}
export const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID!, // from Backblaze
  applicationKey: process.env.B2_APP_KEY!, // from Backblaze
});

export async function authorizeB2() {
  // Always re-authorize on every call — B2 tokens expire after 24h and the
  // singleton's internal state is unreliable across serverless invocations.
  await b2.authorize();
}
export const downloadFile = async (
  url: string,
  id: string,
  filename: string
) => {
  let downloadUrl = url;

  if (url.includes("backblazeb2.com")) {
    const authResponse = await fetch(`/api/books/${id}/download`);
    if (!authResponse.ok) {
      throw new Error("Failed to get authenticated download URL");
    }
    const data = await authResponse.json();
    downloadUrl = data.url;
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error("Failed to download file");
  }
  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "DOWNLOAD",
      targetId: id,
    }),
  });
  document.body.removeChild(link);

  URL.revokeObjectURL(blobUrl);
};
