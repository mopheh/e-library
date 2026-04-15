"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  User, 
  BookOpen, 
  ClipboardList, 
  Bookmark, 
  MonitorPlay,
  Trophy,
  Sparkles,
  Briefcase,
  Zap,
  Menu,
  X,
  Crown,
  ShieldCheck
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useUserData } from "@/hooks/useUsers";
import { STORAGE_KEY } from "@/lib/utils";
import SidebarRepWidget from "./SidebarRepWidget";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SidebarProps {
  role?: string;
  isOpen?: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { data: userData } = useUserData();
  const role = userData?.role?.toLowerCase() || "student";
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(pathname);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNavigation = (id: string, route: string) => {
    setActive(id);
    router.push(route);
    if (window.innerWidth < 640 && isOpen) {
      toggle();
    }
  };

  const menuGroupings = role === "aspirant" ? [
    {
       label: "Core",
       defaultOpen: true,
       items: [
         { name: "Hub Dashboard", path: "/dashboard", icon: LayoutDashboard, id: "dashboard" },
         { name: "Messages", path: "/dashboard/messages", icon: MessageSquare, id: "/dashboard/messages" },
         { name: "Verification", path: "/verify", icon: Settings, id: "/verify" },
       ]
    },
    {
       label: "Academics",
       defaultOpen: true,
       items: [
         { name: "CBT Practice", path: "/cbt", icon: ClipboardList, id: "/cbt" },
         { name: "Study Roadmap", path: "/roadmap", icon: Bookmark, id: "/roadmap" },
       ]
    },
    {
       label: "Community",
       defaultOpen: false,
       items: [
         { name: "Dept Preview", path: "/preview", icon: BookOpen, id: "/preview" },
         { name: "Connect", path: "/connect", icon: User, id: "/connect" },
       ]
    }
  ] : [
    {
       label: "Core",
       defaultOpen: true,
       items: [
         { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, id: "dashboard" },
         { name: "Messages", path: "/dashboard/messages", icon: MessageSquare, id: "/dashboard/messages" },
         { name: "Profile", path: "/profile", icon: User, id: "/profile" },
       ]
    },
    {
       label: "Academics",
       defaultOpen: true,
       items: [
         { name: "My Workspace", path: "/dashboard/workspaces", icon: MonitorPlay, id: "/dashboard/workspaces" },
         { name: "Library", path: "/library", icon: BookOpen, id: "/library" },
         { name: "CBT", path: "/cbt", icon: ClipboardList, id: "/cbt" },
         { name: "Saved", path: "/saved", icon: Bookmark, id: "/saved" },
       ]
    },
    {
       label: "Community",
       defaultOpen: false,
       items: [
         { name: "Leaderboard", path: "/dashboard/leaderboard", icon: Trophy, id: "/dashboard/leaderboard" },
         { name: "Ask Seniors", path: "/dashboard/ask-seniors", icon: Sparkles, id: "/dashboard/ask-seniors" },
         { name: "Connect", path: "/connect", icon: User, id: "/connect" },
       ]
    },
    {
       label: "Discover",
       defaultOpen: false,
       items: [
         { name: "Opportunities", path: "/dashboard/opportunities", icon: Briefcase, id: "/dashboard/opportunities" },
         { name: "Dept Preview", path: "/preview", icon: BookOpen, id: "/preview" },
       ]
    }
  ];
  
  const defaultValues = menuGroupings.filter(g => g.defaultOpen).map(g => g.label);

  return (
    <>
      <div className="hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggle}
          className="p-2 bg-white dark:bg-zinc-900 text-zinc-900  dark:text-white rounded-full shadow-md"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      <aside
        className={`fixed top-0 left-0 w-80 bg-zinc-50 dark:bg-zinc-950 h-screen p-6 z-40 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 md:static border-r border-zinc-200 dark:border-zinc-800/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        <div className="flex flex-col gap-8 h-full relative">
          <div className="w-full pl-2">
            <Image
              src="/univault.png"
              alt="Univault Logo"
              className="dark:brightness-200"
              width={140}
              height={40}
              priority
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <Accordion type="multiple" defaultValue={defaultValues} className="w-full space-y-4">
              {menuGroupings.map((group) => (
                <AccordionItem value={group.label} key={group.label} className="border-none">
                  <AccordionTrigger className="py-2 px-2 hover:no-underline rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      {group.label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-2 space-y-1">
                    {group.items.map(({ name, icon: Icon, id, path }) => {
                      const isActive = pathname === id || (id !== "dashboard" && pathname.startsWith(id));
                      return (
                        <div
                          key={id}
                          onClick={() => handleNavigation(id, path)}
                          className={`flex items-center gap-3 py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                            isActive
                              ? "bg-white dark:bg-zinc-900 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-blue-500/20 text-blue-600 dark:text-blue-400"
                              : "text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-zinc-900"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "opacity-70"}`} />
                          <span className={`font-poppins text-xs ${isActive ? "font-bold" : "font-medium"}`}>
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Upgrade Card */}
          <div className="mt-4 p-5 glass-card rounded-2xl border-blue-100 dark:border-blue-900/30 flex flex-col gap-3 relative overflow-hidden group">
             <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-125 transition-transform">
                <Crown className="w-20 h-20 text-blue-600" />
             </div>
             <div>
                <h4 className="text-sm font-semibold font-poppins text-zinc-900 dark:text-zinc-100">Level Up?</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[150px] font-manrope font-normal">Get unlimited AI Tutor requests and full CBT access.</p>
             </div>
             <Link href="/dashboard/pricing">
                <button className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-normal font-manrope shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-colors flex items-center gap-1.5 w-fit">
                   <Zap className="w-3 h-3 fill-white" /> Upgrade Now
                </button>
             </Link>
          </div>

          <div className="pt-2 flex flex-col gap-4 mt-auto">
              <hr className="border-t border-zinc-200 dark:border-zinc-800" />
              
              {/* Admin & Faculty Rep Links */}
              {(role === "admin" || role === "faculty rep" || role === "faculty-rep") && (
                <div
                  onClick={() => router.push("/dashboard/manage")}
                  className="flex gap-3 font-poppins text-xs items-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition-colors text-blue-600 dark:text-blue-400 font-light"
                >
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Management Hub</span>
                </div>
              )}
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={toggle}
        />
      )}
    </>
  );
};

export default Sidebar;
