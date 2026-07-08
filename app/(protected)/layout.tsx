"use client"
import Sidebar from "@/components/Dashboard/Sidebar";
import Nav from "@/components/Dashboard/Nav";
import ChatSidebar from "@/components/Chat/ChatSidebar";
import { useRef, useState } from "react";
import BottomNav from "@/components/Dashboard/MobileNav";
import MobileMessagingButton from "@/components/Dashboard/MobileMessagingButton";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { LogoLoader } from "@/components/LogoLoader";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!isLoaded) return <LogoLoader />;
  return (
    <>
      <div className="bg-zinc-50 dark:bg-zinc-900 flex h-screen">
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

        <div
          ref={scrollRef}
          className={`flex-1 flex flex-col p-2 sm:p-4 sm:py-6 min-w-0
            w-full overflow-y-auto ${isSidebarOpen ? "!overflow-hidden" : ""}`}
        >
          <Nav />
          <main>{children}</main>
        </div>
      </div>
      {!pathname?.includes("/book/") && (
        <>
          <MobileMessagingButton />
          <BottomNav scrollRef={scrollRef} toggleSidebar={toggleSidebar} />
        </>
      )}
      <ChatSidebar />
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
