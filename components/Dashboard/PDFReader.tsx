"use client";

import { Viewer, Worker } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

import { searchPlugin } from "@react-pdf-viewer/search";
import "@react-pdf-viewer/search/lib/styles/index.css";

import { bookmarkPlugin } from "@react-pdf-viewer/bookmark";
import "@react-pdf-viewer/bookmark/lib/styles/index.css";

import { 
  highlightPlugin, 
  RenderHighlightTargetProps, 
  RenderHighlightContentProps, 
  RenderHighlightsProps 
} from "@react-pdf-viewer/highlight";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AIChatAssistant from "@/components/Dashboard/Assistant";
import { useBookPages } from "@/hooks/useBooks";
import { STORAGE_KEY } from "@/lib/utils";
import { getOfflinePdf, checkIsPdfOffline } from "@/lib/offline-storage";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IoBookOutline } from "react-icons/io5";
import { AiOutlineBook } from "react-icons/ai";

interface PDFStudyViewProps {
  fileUrl: string;
  bookId: string;
}

const renderLoader = (percentages: number) => (
  <div className="flex flex-col items-center justify-center w-full h-full text-zinc-500">
    <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-zinc-600 animate-spin mb-4" />
    <span className="text-sm font-medium">Loading document... {Math.round(percentages)}%</span>
  </div>
);

const PDFStudyView = ({ fileUrl, bookId }: PDFStudyViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedPages = useRef<Set<number>>(new Set());
  const sessionStart = useRef<number>(Date.now());
  
  const [sidebarMode, setSidebarMode] = useState<"assistant" | "outline" | "none">("assistant");
  const isSidebarOpen = sidebarMode !== "none";
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageText, setPageText] = useState("");
  const [displayUrl, setDisplayUrl] = useState<string | Uint8Array>(fileUrl);

  const { data: dbProgress, isLoading: loadingProgress } = useQuery({
    queryKey: ["book-progress", bookId],
    queryFn: async () => {
      const res = await fetch(`/api/users/book-progress?bookId=${bookId}`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  useEffect(() => {
    const loadDefaultUrl = async () => {
      // First check if it's stored for offline use
      const isOffline = await checkIsPdfOffline(bookId);
      if (isOffline) {
        const blob = await getOfflinePdf(bookId);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          setDisplayUrl(blobUrl);
          return;
        }
      }
      
      // Use the proxy endpoint to bypass CORS and simplify signed URL management
      setDisplayUrl(`/api/books/${bookId}/proxy`);
    };
    loadDefaultUrl();
  }, [bookId]);

  const { data: pages } = useBookPages(bookId);

  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

  const pageNavPluginInstance = pageNavigationPlugin();
  const { CurrentPageLabel, GoToNextPage, GoToPreviousPage } = pageNavPluginInstance;

  const searchPluginInstance = searchPlugin();
  const { ShowSearchPopover } = searchPluginInstance;

  const bookmarkPluginInstance = bookmarkPlugin();
  const { Bookmarks } = bookmarkPluginInstance;

  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [isPublicNote, setIsPublicNote] = useState(false);

  const { data: annotations = [] } = useQuery({
    queryKey: ["annotations", bookId],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/books/${bookId}/annotations`, { signal });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const saveAnnotation = useMutation({
    mutationFn: async (newNote: any) => {
      const res = await fetch(`/api/books/${bookId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });
      if (!res.ok) throw new Error("Failed to save annotation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", bookId] });
      toast.success("Note saved successfully!");
      setNoteText("");
      setIsPublicNote(false);
    },
    onError: () => toast.error("Failed to save note"),
  });

  const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e4e4e7",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        display: "flex",
        position: "absolute",
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: "translate(0, 8px)",
        zIndex: 10,
        padding: "4px"
      }}
    >
      <button 
        onClick={props.toggle}
        className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors"
      >
        Add Note
      </button>
    </div>
  );

  const renderHighlightContent = (props: RenderHighlightContentProps) => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl p-4 w-[300px] flex flex-col gap-3">
        <h4 className="font-semibold text-sm">Add a Note</h4>
        <textarea 
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Type your notes here..."
          className="w-full h-24 p-2 text-sm border font-open-sans border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-950 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        ></textarea>
        <div className="flex items-center gap-2">
           <input 
             type="checkbox" 
             id="publicNote" 
             checked={isPublicNote} 
             onChange={(e) => setIsPublicNote(e.target.checked)} 
             className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
           />
           <label htmlFor="publicNote" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Make public (Share with course)</label>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={props.cancel} className="text-xs font-medium text-zinc-500 hover:text-zinc-800 px-3 py-1.5">Cancel</button>
          <button 
            onClick={() => {
              if (noteText.trim()) {
                saveAnnotation.mutate({
                  pageNumber: props.selectionRegion.pageIndex,
                  text: noteText,
                  coordinates: props.highlightAreas,
                  isPublic: isPublicNote,
                  color: "yellow"
                });
                props.cancel();
              }
            }}
            disabled={!noteText.trim()}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md disabled:bg-indigo-600/50"
          >
            Save Note
          </button>
        </div>
      </div>
    );
  };

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
    renderHighlights: (props: RenderHighlightsProps) => (
      <div>
        {annotations.map((note: any) => (
          <div key={note.id}>
            {note.coordinates.map((area: any, idx: number) => (
              <div
                key={idx}
                style={{
                  background: note.color === "yellow" ? "#fef08a" : note.color, // Default to Tailwind yellow-200
                  opacity: 0.4,
                  position: "absolute",
                  left: `${area.left}%`,
                  top: `${area.top}%`,
                  width: `${area.width}%`,
                  height: `${area.height}%`,
                }}
                title={`${note.user?.fullName ? note.user.fullName + ': ' : ''}${note.text}`}
              />
            ))}
          </div>
        ))}
      </div>
    ),
  });

  // Custom plugin for efficient scroll tracking
  const scrollTrackerPlugin = () => ({
    install: (pluginFunctions: any) => {
        const container = pluginFunctions.getPagesContainer();
        if (container) {
            container.addEventListener("scroll", handleScroll);
            // Initial restore - prefer DB, fallback to localStorage
            let initialPercent = 0;
            if (dbProgress && dbProgress.progress > 0) {
              initialPercent = dbProgress.progress;
            } else {
                const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
                const found = stored.find((b: { id: string }) => b.id === bookId);
                if (found) initialPercent = found.progress;
            }

            if (initialPercent > 0) {
                const scrollY = (initialPercent / 100) * (container.scrollHeight - container.clientHeight);
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

      if (pages && pages.length > 0) {
        const pageHeight = scrollHeight / pages.length;
        // ensure visiblePage is safely bounded between 0 and pages.length - 1
        let visiblePage = Math.floor(scrollTop / pageHeight);
        visiblePage = Math.max(0, Math.min(visiblePage, pages.length - 1));
        
        if (visiblePage !== currentPage) {
            setCurrentPage(visiblePage);
            viewedPages.current.add(visiblePage);
        }
      }
      
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = stored.map((b: { id: string; [key: string]: any }) =>
        b.id === bookId ? { ...b, progress: Math.round(percent) } : b,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  useEffect(() => {
    if (pages && pages.length > 0) {
      setPageText(pages[currentPage]?.textChunk || "");
    }
  }, [pages, currentPage]);


  useEffect(() => {
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "READ",
        targetId: bookId,
        meta: { action: "OPENED" },
      }),
    }).catch(err => console.debug("Analytics fetch failed:", err));
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
        }).catch(err => console.debug("Analytics session failed:", err));

        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "READ",
            targetId: bookId,
            meta: { pagesRead, duration, currentPage },
          }),
        }).catch(err => console.debug("Analytics activity failed:", err));

        sessionStart.current = now;
        viewedPages.current.clear();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [bookId]);

  // Sync progress to DB every 30 seconds
  const lastSyncedProgress = useRef<number>(0);
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (Math.abs(scrollPercent - lastSyncedProgress.current) > 2) {
        fetch("/api/users/book-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             bookId,
             progress: Math.round(scrollPercent),
             lastPage: currentPage
          })
        }).then(() => {
           lastSyncedProgress.current = scrollPercent;
        }).catch(err => console.debug("Progress sync failed:", err));
      }
    }, 30 * 1000);
    return () => clearInterval(syncInterval);
  }, [bookId, scrollPercent, currentPage]);

  useEffect(() => {
    const countAsRead = setTimeout(
      () => {
        fetch("/api/users/book-count", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookId }),
        }).catch(err => console.debug("Book count analytics failed:", err));
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
                <div className="flex items-center ml-2 border-l border-zinc-200 dark:border-zinc-700 pl-4">
                    <ShowSearchPopover />
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <div className="text-xs font-medium text-zinc-400">
                    {Math.round(scrollPercent)}%
                 </div>
                 <button 
                  onClick={() => setSidebarMode(sidebarMode === "outline" ? "none" : "outline")}
                  className={`p-2 rounded-lg transition-colors ${sidebarMode === "outline" ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"}`}
                  title={sidebarMode === "outline" ? "Close Outline" : "Open Outline"}
                 >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
                 </button>
                 <button 
                  onClick={() => setSidebarMode(sidebarMode === "assistant" ? "none" : "assistant")}
                  className={`p-2 rounded-lg transition-colors ${sidebarMode === "assistant" ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"}`}
                  title={sidebarMode === "assistant" ? "Close Assistant" : "Open Assistant"}
                 >
                    {sidebarMode === "assistant" ? <IoBookOutline size={20} /> : <AiOutlineBook size={20} />}
                 </button>
            </div>
         </div>

         <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-950/50">
            <div className="absolute inset-0 overflow-hidden">
                {displayUrl ? (
                  <Worker workerUrl="/pdf.worker.min.js">
                    <Viewer
                      fileUrl={displayUrl}
                      defaultScale={1.2}
                      renderLoader={renderLoader}
                      plugins={[
                        zoomPluginInstance,
                        pageNavPluginInstance,
                        searchPluginInstance,
                        bookmarkPluginInstance,
                        highlightPluginInstance
                      ]}
                      onPageChange={(e) => setCurrentPage(e.currentPage)}
                    />
                  </Worker>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    {renderLoader(0)}
                  </div>
                )}
            </div>
         </div>
      </div>

       {/* Assistant and Outline Sidebar */}
      <div className={`hidden md:flex border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 ease-in-out h-full overflow-hidden ${
          isSidebarOpen ? "w-[35%] opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-full"
      }`}>
         {sidebarMode === "assistant" && <AIChatAssistant pageText={pageText} bookId={bookId} />}
         {sidebarMode === "outline" && (
             <div className="w-full h-full font-poppins p-4 overflow-y-auto bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold mb-4 text-zinc-600 dark:text-zinc-300">Table of Contents</h3>
                <div className="text-xs">
                   <Bookmarks />
                </div>
             </div>
         )}
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
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-200">
                    <ZoomOutButton />
                    <ZoomInButton />
                    <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                    <ShowSearchPopover />
                  </div>
                  <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-200">
                    <GoToPreviousPage />
                    <CurrentPageLabel />
                    <GoToNextPage />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden relative"> 
                    {displayUrl ? (
                      <Worker workerUrl="/pdf.worker.min.js">
                          <Viewer
                          fileUrl={displayUrl}
                          defaultScale={0.8}
                          onPageChange={(e) => setCurrentPage(e.currentPage)}
                          renderLoader={renderLoader}
                          plugins={[zoomPluginInstance, pageNavPluginInstance, scrollPluginInstance, searchPluginInstance, bookmarkPluginInstance, highlightPluginInstance]}
                          />
                      </Worker>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {renderLoader(0)}
                      </div>
                    )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="outline"
              forceMount
              className="h-full data-[state=inactive]:hidden w-full overflow-y-auto"
            >
              <div className="p-4 h-full bg-white dark:bg-zinc-900">
                <h3 className="text-sm font-semibold mb-4 text-zinc-600 dark:text-zinc-300">Table of Contents</h3>
                <div className="text-sm font-poppins">
                   <Bookmarks />
                </div>
              </div>
            </TabsContent>
          </div>

          <TabsList className="fixed bottom-0 left-0 w-full flex justify-around font-poppins text-xs border-t dark:bg-zinc-900 text-zinc-500 bg-zinc-50 z-50 h-14 pb-safe">
            <TabsTrigger value="study" className="flex-1 h-full rounded-none">
              <div className="flex flex-col items-center gap-1">
                 <IoBookOutline size={20} /> 
                 <span>Read</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="outline" className="flex-1 h-full rounded-none">
               <div className="flex flex-col items-center gap-1">
                 <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
                 <span>Outline</span>
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
