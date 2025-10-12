"use client";
import Sidebar from "@/components/Dashboard/Sidebar";
import Nav from "@/components/Dashboard/Nav";
import { useState } from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 flex h-screen">
      <div className="h-screen sticky top-0 z-50">
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      </div>

      <div
        className={`flex-1 flex flex-col p-2 sm:p-4 sm:py-6 overflow-y-auto ${
          isSidebarOpen ? "!overflow-hidden" : ""
        }`}
      >
        <Nav />
        <main>{children}</main>
      </div>
    </div>
  );
}
