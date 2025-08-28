"use client";
import Sidebar from "@/components/Dashboard/Sidebar";
import Nav from "@/components/Dashboard/Nav";
import { useState } from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex pb-16 sm:pb-0">
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <div
        className={`p-2 sm:p-4 sm:py-6 flex-1 sm:w-auto w-screen sm:min-h-screen ${isSidebarOpen ? "!overflow-hidden" : ""}`}
      >
        <Nav />
        <main>{children}</main>
      </div>
    </div>
  );
}
