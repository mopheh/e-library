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

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {IoBookOutline} from "react-icons/io5";
import {AiOutlineBook} from "react-icons/ai";

interface PDFStudyViewProps {
    fileUrl: string;
    bookId: string;
}

const PDFStudyView = ({ fileUrl, bookId }: PDFStudyViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewedPages = useRef<Set<number>>(new Set());
    const [pdfScrollContainer, setPdfScrollContainer] =
        useState<HTMLDivElement | null>(null);
    const [scrollPercent, setScrollPercent] = useState(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pageText, setPageText] = useState("");

    const { data: pages } = useBookPages(bookId);

    const zoomPluginInstance = zoomPlugin();
    const { ZoomInButton, ZoomOutButton, ZoomPopover } = zoomPluginInstance;

    const pageNavPluginInstance = pageNavigationPlugin();
    const { CurrentPageLabel, GoToNextPage, GoToPreviousPage } =
        pageNavPluginInstance;

    // Detect PDF scroll container
    useEffect(() => {
        const interval = setInterval(() => {
            const el = document.querySelector(
                ".rpv-core__inner-pages"
            ) as HTMLDivElement;
            if (el && el.scrollHeight > el.clientHeight) {
                setPdfScrollContainer(el);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Scroll tracking & update current page
    useEffect(() => {
        if (!pdfScrollContainer || !pages) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = pdfScrollContainer;
            const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setScrollPercent(percent);

            const pageHeight = scrollHeight / pages.length;
            const visiblePage = Math.floor(scrollTop / pageHeight);
            if (visiblePage !== currentPage) {
                setCurrentPage(visiblePage);
                viewedPages.current.add(visiblePage);
                setPageText(pages[visiblePage]?.textChunk || "");
            }

            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const updated = stored.map((b: { id: string; [key: string]: any }) =>
                b.id === bookId ? { ...b, progress: Math.round(percent) } : b
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        };

        pdfScrollContainer.addEventListener("scroll", handleScroll);
        return () => pdfScrollContainer.removeEventListener("scroll", handleScroll);
    }, [pdfScrollContainer, pages, bookId, currentPage]);

    // Restore scroll
    useEffect(() => {
        if (!pdfScrollContainer) return;
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const found = stored.find((b: { id: string }) => b.id === bookId);
        if (found) {
            const scrollY =
                (found.progress / 100) *
                (pdfScrollContainer.scrollHeight - pdfScrollContainer.clientHeight);
            pdfScrollContainer.scrollTo(0, scrollY);
        }
    }, [pdfScrollContainer, bookId]);

    return (
        <div className="h-[85vh] w-full">
            {/* Desktop: Split view */}
            <div className="hidden md:flex h-full">
                <div className="w-[60%] h-full border-r flex flex-col">
                    <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 border-b">
                        <div className="flex items-center gap-2 text-xs">
                            <ZoomOutButton />
                            <ZoomPopover />
                            <ZoomInButton />
                        </div>
                        <div className="flex items-center gap-2">
                            <GoToPreviousPage />
                            <CurrentPageLabel />
                            <GoToNextPage />
                        </div>
                        <div className="text-sm text-gray-500">
                            {Math.round(scrollPercent)}%
                        </div>
                    </div>
                    <div ref={containerRef} className="flex-1 overflow-y-scroll">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                            <Viewer
                                fileUrl={fileUrl}
                                defaultScale={1.2}
                                onPageChange={(e) => setCurrentPage(e.currentPage - 1)}
                                plugins={[zoomPluginInstance, pageNavPluginInstance]}
                            />
                        </Worker>
                    </div>
                </div>

                <div className="w-[40%]">
                    <AIChatAssistant pageText={pageText} />
                </div>
            </div>

            {/* Mobile: Tabs */}
            <div className="md:hidden h-full flex flex-col">
                <Tabs defaultValue="study" className="flex flex-col h-full">
                    <div className="flex-1 overflow-hidden">
                        <TabsContent value="study" forceMount className="h-full data-[state=inactive]:hidden">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 border-b">
                                    <div className="flex items-center gap-2 text-xs">
                                        <ZoomOutButton />
                                        <ZoomPopover />
                                        <ZoomInButton />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <GoToPreviousPage />
                                        <CurrentPageLabel />
                                        <GoToNextPage />
                                    </div>
                                </div>
                                <div
                                    ref={containerRef}
                                    className="flex-1 overflow-y-scroll"
                                >
                                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                        <Viewer
                                            fileUrl={fileUrl}
                                            defaultScale={1.2}
                                            onPageChange={(e) => setCurrentPage(e.currentPage - 1)}
                                            plugins={[zoomPluginInstance, pageNavPluginInstance]}
                                        />
                                    </Worker>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="assistant" forceMount className="h-full data-[state=inactive]:hidden">
                            <AIChatAssistant pageText={pageText} />
                        </TabsContent>
                    </div>


                    <TabsList className="fixed bottom-0 left-0 w-full flex justify-around font-poppins text-xs border-t dark:bg-gray-900 text-gray-500 bg-neutral-200">
                        <TabsTrigger value="study" className="flex-1 py-3">
                            <IoBookOutline /> Study
                        </TabsTrigger>
                        <TabsTrigger value="assistant" className="flex-1 py-3">
                            <AiOutlineBook /> Assistant
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </div>
    );
};

export default PDFStudyView;
