"use client";

import { Viewer, Worker } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

import { useEffect, useRef, useState } from "react";
import AIChatAssistant from "@/components/Dashboard/Assistant";
import { useBookPages } from "@/hooks/useBooks";
import { STORAGE_KEY } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IoBookOutline } from "react-icons/io5";
import { AiOutlineBook } from "react-icons/ai";

interface PDFStudyViewProps {
  fileUrl: string;
  bookId: string;
}

const PDFStudyView = ({ fileUrl, bookId }: PDFStudyViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedPages = useRef<Set<number>>(new Set());
  const sessionStart = useRef<number>(Date.now());
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageText, setPageText] = useState("");

  const { data: pages } = useBookPages(bookId);

  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

  const pageNavPluginInstance = pageNavigationPlugin();
  const { CurrentPageLabel, GoToNextPage, GoToPreviousPage } = pageNavPluginInstance;

  // Custom plugin for efficient scroll tracking
  const scrollTrackerPlugin = () => ({
    install: (pluginFunctions: any) => {
        const container = pluginFunctions.getPagesContainer();
        if (container) {
            container.addEventListener("scroll", handleScroll);
             // Initial restore
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const found = stored.find((b: { id: string }) => b.id === bookId);
            if (found) {
                const scrollY = (found.progress / 100) * (container.scrollHeight - container.clientHeight);
                container.scrollTo(0, scrollY);
            }
        }
    },
    uninstall: (pluginFunctions: any) => {
        const container = pluginFunctions.getPagesContainer();
        if (container) {
            container.removeEventListener("scroll", handleScroll);
        }
    }
  });

  const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollPercent(percent);

      if (pages) {
        const pageHeight = scrollHeight / pages.length;
        const visiblePage = Math.floor(scrollTop / pageHeight);
        if (visiblePage !== currentPage) {
            setCurrentPage(visiblePage);
            viewedPages.current.add(visiblePage);
            setPageText(pages[visiblePage]?.textChunk || "");
        }
      }
      
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = stored.map((b: { id: string; [key: string]: any }) =>
        b.id === bookId ? { ...b, progress: Math.round(percent) } : b,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };


  useEffect(() => {
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "READ",
        targetId: bookId,
        meta: { action: "OPENED" },
      }),
    });
  }, [bookId]);

  // POST reading session every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - sessionStart.current) / 60000);
      const pagesRead = viewedPages.current.size;

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

        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "READ",
            targetId: bookId,
            meta: { pagesRead, duration, currentPage },
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
            body: JSON.stringify({ bookId }),
        });
      },
      2 * 60 * 1000,
    );
    return () => clearTimeout(countAsRead);
  }, []);

  const scrollPluginInstance = scrollTrackerPlugin();

  return (
    <div className="h-full w-full overflow-hidden flex flex-col md:flex-row">
      {/* Desktop Layout */}
      <div className={`hidden md:flex flex-col transition-all duration-300 ease-in-out h-full ${
          isSidebarOpen ? "w-[65%]" : "w-full"
      }`}>
         {/* Custom Floating Toolbar */}
         <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                     <ZoomOutButton />
                     <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                     <ZoomInButton />
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    <GoToPreviousPage />
                    <span className="min-w-[3rem] text-center"><CurrentPageLabel /></span>
                    <GoToNextPage />
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <div className="text-xs font-medium text-zinc-400">
                    {Math.round(scrollPercent)}%
                 </div>
                 <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
                  title={isSidebarOpen ? "Close Assistant" : "Open Assistant"}
                 >
                    {isSidebarOpen ? <IoBookOutline size={20} /> : <AiOutlineBook size={20} />}
                 </button>
            </div>
         </div>

         <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-950/50">
            <div className="absolute inset-0 overflow-hidden">
                <Worker workerUrl="/pdf.worker.min.js">
                  <Viewer
                    fileUrl={fileUrl}
                    defaultScale={1.2}
                    plugins={[zoomPluginInstance, pageNavPluginInstance, scrollPluginInstance]}
                  />
                </Worker>
            </div>
         </div>
      </div>

       {/* Assistant Sidebar */}
      <div className={`hidden md:flex border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 ease-in-out h-full overflow-hidden ${
          isSidebarOpen ? "w-[35%] opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-full"
      }`}>
         {isSidebarOpen && <AIChatAssistant pageText={pageText} />}
      </div>

      {/* Mobile Layout (Unchanged mostly, just worker update) */}
      <div className="md:hidden h-full flex flex-col w-full">
        <Tabs defaultValue="study" className="flex flex-col h-full w-full">
          <div className="flex-1 overflow-hidden w-full">
            <TabsContent
              value="study"
              forceMount
              className="h-full data-[state=inactive]:hidden w-full"
            >
              <div className="flex flex-col h-full w-full">
                <div className="flex items-center justify-between gap-4 p-3 bg-zinc-100 dark:bg-zinc-800 border-b">
                   {/* Mobile Toolbar */}
                  <div className="flex items-center gap-4 text-zinc-900 dark:text-zinc-200 ">
                    <ZoomOutButton />
                     <ZoomInButton />
                  </div>
                  <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-200">
                    <GoToPreviousPage />
                    <CurrentPageLabel />
                    <GoToNextPage />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden relative"> 
                    <Worker workerUrl="/pdf.worker.min.js">
                        <Viewer
                        fileUrl={fileUrl}
                        defaultScale={0.8}
                        onPageChange={(e) => setCurrentPage(e.currentPage)}
                        plugins={[zoomPluginInstance, pageNavPluginInstance, scrollPluginInstance]}
                        />
                    </Worker>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="assistant"
              forceMount
              className="h-full data-[state=inactive]:hidden w-full"
            >
              <AIChatAssistant pageText={pageText} />
            </TabsContent>
          </div>

          <TabsList className="fixed bottom-0 left-0 w-full flex justify-around font-poppins text-xs border-t dark:bg-zinc-900 text-zinc-500 bg-zinc-50 z-50 h-14">
            <TabsTrigger value="study" className="flex-1 h-full rounded-none">
              <div className="flex flex-col items-center gap-1">
                 <IoBookOutline size={20} /> 
                 <span>Read</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex-1 h-full rounded-none">
               <div className="flex flex-col items-center gap-1">
                 <AiOutlineBook size={20} /> 
                 <span>Assistant</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default PDFStudyView;
