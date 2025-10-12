import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDocument } from "pdfjs-dist";
import B2 from "backblaze-b2";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const STORAGE_KEY = "recentlyViewedBooks";

export const addRecentlyViewedBook = (book: { id: any; progress: number }) => {
  if (!book?.id) return;

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const filtered = stored.filter((b: { id: any }) => b.id !== book.id); // avoid duplicates

  const updated = [book, ...filtered].slice(0, 5); // max 5 recent

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getRecentlyViewedBooks = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  console.log(stored);
  return stored ? JSON.parse(stored) : [];
};
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
  return content.items.map((item: any) => item.str).join(" ");
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
  return (
    input
      // Headings for problems
      .replace(/^(\d+)\.\s+/gm, "### $1. ")

      // Bolden keywords
      .replace(/\b(Intersection|Area|Result|Ans\.)\b/gi, "**$1:**")

      // Inline LaTeX already with \( ... \)
      .replace(/\\\((.*?)\\\)/g, (_, expr) => `$${expr.trim()}$`)

      // Block LaTeX already with \[ ... \]
      .replace(/\\\[(.*?)\\\]/g, (_, expr) => `$$${expr.trim()}$$`)

      // If a line looks like pure math, wrap as block math
      .replace(/^( *[\(\)\d+\-\+\*\/=a-zA-Z\^\{\}\\ ]+ *)$/gm, (line) => {
        return `$$${line.trim()}$$`;
      })
  );
}
export const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID!, // from Backblaze
  applicationKey: process.env.B2_APP_KEY!, // from Backblaze
});

export async function authorizeB2() {
  //@ts-ignore
  if (!b2.authorizationToken) {
    await b2.authorize(); // gets auth + API URLs
  }
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
