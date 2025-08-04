"use client";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

import { useEffect, useRef, useState } from "react";
import {
  extractTextFromPage,
  getMostVisiblePage,
  STORAGE_KEY,
} from "@/lib/utils";
import AIChatAssistant from "@/components/Dashboard/Assistant";

interface PDFStudyViewProps {
  fileUrl: string;
  bookId: string;
}

const PDFStudyView = ({ fileUrl, bookId }: PDFStudyViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedPages = useRef<Set<number>>(new Set());

  const sessionStart = useRef<number>(Date.now());
  const startPage = useRef<number | null>(null);
  const lastVisiblePage = useRef<number | null>(null);

  const [pdfScrollContainer, setPdfScrollContainer] =
    useState<HTMLDivElement | null>(null);

  const [scrollPercent, setScrollPercent] = useState(0);
  const [pageText, setPageText] = useState("");
  const [currentPage, setCurrentPage] = useState();

  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

  const pageNavPluginInstance = pageNavigationPlugin();
  const { CurrentPageLabel, GoToNextPage, GoToPreviousPage } =
    pageNavPluginInstance;

  // Detect PDF scroll container
  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.querySelector(
        ".rpv-core__inner-pages",
      ) as HTMLDivElement;
      if (el && el.scrollHeight > el.clientHeight) {
        setPdfScrollContainer(el);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Scroll tracking
  useEffect(() => {
    if (!pdfScrollContainer) return;

    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = pdfScrollContainer;
      const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollPercent(percent);

      // Update localStorage progress
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = stored.map((b: { id: string; [key: string]: any }) =>
        b.id === bookId ? { ...b, progress: Math.round(percent) } : b,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      const mostVisible = getMostVisiblePage(pdfScrollContainer);

      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (mostVisible !== null && mostVisible !== lastVisiblePage.current) {
          lastVisiblePage.current = mostVisible;
          // @ts-ignore
          setCurrentPage(mostVisible);
        }
      }, 100);
      // console.log("mostVisiblePage:", mostVisible); // Always logs now
    };

    pdfScrollContainer.addEventListener("scroll", handleScroll);
    return () => pdfScrollContainer.removeEventListener("scroll", handleScroll);
  }, [pdfScrollContainer, bookId]);

  useEffect(() => {
    if (currentPage !== undefined) {
      extractTextFromPage(fileUrl, currentPage + 1)
        .then((text) => {
          setPageText(text || "");
          viewedPages.current.add(currentPage + 1);
          console.log(`Live pageText [page ${currentPage + 1}]:`);
        })
        .catch((err) => {
          console.error("Text extraction error:", err);
          setPageText("");
        });
    }
  }, [currentPage, fileUrl]);

  // Restore scroll position
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const found = stored.find((b: { id: string }) => b.id === bookId);
    if (found && pdfScrollContainer) {
      const scrollY =
        (found.progress / 100) *
        (pdfScrollContainer.scrollHeight - pdfScrollContainer.clientHeight);
      pdfScrollContainer.scrollTo(0, scrollY);
    }
  }, [bookId, pdfScrollContainer]);

  // POST reading session every minute
  useEffect(() => {
    console.log(bookId);

    const interval = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - sessionStart.current) / 60000);
      const pagesRead = viewedPages.current.size;
      console.log(pagesRead);

      if (bookId && pagesRead > 0) {
        fetch("/api/users/reading-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId,
            pagesRead,
            duration,
          }),
        });

        sessionStart.current = now;
        viewedPages.current.clear();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [bookId]);
  useEffect(() => {
    const countAsRead = setTimeout(
      () => {
        fetch("/api/users/book-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId,
          }),
        });
      },
      2 * 60 * 1000,
    );
    return () => clearTimeout(countAsRead);
  }, []);
  return (
    <div className="flex h-[85vh] w-full overflow-clip gap-2">
      <div className="w-[60%] h-[100%] border-r">
        <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 border-b">
          <div className="flex items-center gap-2 font-poppins text-xs">
            <ZoomOutButton />
            <ZoomPopover />
            <ZoomInButton />
          </div>
          <div className="flex items-center gap-2">
            <GoToPreviousPage />
            <CurrentPageLabel />
            <GoToNextPage />
          </div>
          <div className="text-sm font-rubik text-gray-500">
            {Math.round(scrollPercent)}%
          </div>
        </div>

        <div ref={containerRef} className="h-[95%] overflow-y-scroll">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={fileUrl}
              defaultScale={1.2}
              onPageChange={(e) => {
                // @ts-ignore
                setCurrentPage(e.currentPage); // This gives you the visible page index
              }}
              plugins={[zoomPluginInstance, pageNavPluginInstance]}
            />
          </Worker>
        </div>
      </div>

      <AIChatAssistant pageText={pageText} />
    </div>
  );
};

export default PDFStudyView;
