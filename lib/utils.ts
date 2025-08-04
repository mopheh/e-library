import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getDocument } from "pdfjs-dist"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const STORAGE_KEY = "recentlyViewedBooks"

export const addRecentlyViewedBook = (book: { id: any }) => {
  if (!book?.id) return

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")

  const filtered = stored.filter((b: { id: any }) => b.id !== book.id) // avoid duplicates

  const updated = [book, ...filtered].slice(0, 5) // max 5 recent

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export const getRecentlyViewedBooks = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  console.log(stored)
  return stored ? JSON.parse(stored) : []
}

export const extractTextFromPage = async (
  pdfUrl: string,
  pageNum: number
): Promise<string> => {
  const loadingTask = getDocument(pdfUrl)
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageNum)
  const content = await page.getTextContent()
  return content.items.map((item: any) => item.str).join(" ")
}
export function getMostVisiblePage(container: HTMLDivElement): number | null {
  const pageContainers = Array.from(
    container.querySelectorAll(".rpv-core__page-container")
  ) as HTMLElement[]

  let maxVisibleArea = 0
  let mostVisiblePage: number | null = null
  const containerRect = container.getBoundingClientRect()

  pageContainers.forEach((pageEl, index) => {
    const rect = pageEl.getBoundingClientRect()

    const visibleWidth =
      Math.min(rect.right, containerRect.right) -
      Math.max(rect.left, containerRect.left)
    const visibleHeight =
      Math.min(rect.bottom, containerRect.bottom) -
      Math.max(rect.top, containerRect.top)

    const visibleArea = Math.max(0, visibleWidth) * Math.max(0, visibleHeight)

    if (visibleArea > maxVisibleArea) {
      maxVisibleArea = visibleArea
      mostVisiblePage = index
    }
  })

  return mostVisiblePage
}
export function convertToMarkdownMath(input: string): string {
  return (
    input
      // Inline math: \( ... \)  =>  $...$
      .replace(/\\\((.*?)\\\)/g, (_, expr) => `$${expr.trim()}$`)
      // Block math: \[ ... \]  =>  $$...$$
      .replace(/\\\[(.*?)\\\]/g, (_, expr) => `$$${expr.trim()}$$`)
  )
}
