"use client"
import Sidebar from "@/components/Dashboard/Sidebar";
import Nav from "@/components/Dashboard/Nav";
import { useRef, useState } from "react";
import BottomNav from "@/components/Dashboard/MobileNav";
import { usePathname } from "next/navigation";

export default function layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  return (
    <>
      <div className="bg-zinc-50 dark:bg-zinc-900 flex h-screen">
        <div className="h-screen sticky top-0 z-50">
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
        </div>

        <div
          ref={scrollRef}
          className={`flex-1 flex flex-col p-2 sm:p-4 sm:py-6 min-w-0
            w-full overflow-y-auto ${isSidebarOpen ? "!overflow-hidden" : ""}`}
        >
          <Nav />
          <main>{children}</main>
        </div>
      </div>
      {!pathname?.includes("/book/") && <BottomNav scrollRef={scrollRef} />}
    </>
  );
}
// export default function layout({ children }: { children: React.ReactNode }) {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

//   return (
//     <>
//       <div className="bg-zinc-50 dark:bg-zinc-900 flex min-h-screen">
//         {/* Sidebar */}
//         <div className="sticky top-0 h-screen z-50">
//           <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
//         </div>

//         {/* Main wrapper */}
//         <div
//           className={`flex-1 flex flex-col p-2 sm:p-4 sm:py-6 ${
//             isSidebarOpen ? "!overflow-hidden" : ""
//           }`}
//         >
//           <Nav />

//           {/* IMPORTANT PART */}
//           <main className="pb-24 sm:pb-0">{children}</main>
//         </div>
//       </div>
//       <Bottombar />
//     </>
//   );
// }
