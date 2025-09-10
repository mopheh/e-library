"use client";
import Sidebar from "@/components/Dashboard/Sidebar";
import Nav from "@/components/Dashboard/Nav";
import { useState } from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex h-screen">
      {/* Sidebar (fixed height, doesn't scroll with content) */}
      <div className="h-screen sticky top-0">
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      </div>

      {/* Main content area (scrollable) */}
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
