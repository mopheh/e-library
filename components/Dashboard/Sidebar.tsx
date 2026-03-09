"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import {
  BookOpenIcon,
  ClipboardIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  MonitorPlay,
  Medal,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { ModeToggle } from "../toggle";
import { useAuth, useUser } from "@clerk/nextjs";
import { useUserData } from "@/hooks/useUsers";
import { STORAGE_KEY } from "@/lib/utils";
import SidebarRepWidget from "./SidebarRepWidget";
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
  const { role } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(pathname);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNavigation = (id: string, route: string) => {
    setActive(id);
    router.push(`/${role}/${route}`);
    // toggle();
  };
  const menuGroupings = role === "aspirant" ? [
    {
       label: "Core",
       defaultOpen: true,
       items: [
         { name: "Hub Dashboard", path: "/dashboard", icon: LayoutDashboardIcon, id: "dashboard" },
         { name: "Verification", path: "/verify", icon: SettingsIcon, id: `/${role}/verify` },
       ]
    },
    {
       label: "Academics",
       defaultOpen: true,
       items: [
         { name: "CBT Practice", path: "/cbt", icon: ClipboardIcon, id: `/${role}/cbt` },
         { name: "Study Roadmap", path: "/roadmap", icon: BookmarkIcon, id: `/${role}/roadmap` },
       ]
    },
    {
       label: "Community",
       defaultOpen: false,
       items: [
         { name: "Dept Preview", path: "/preview", icon: BookOpenIcon, id: `/${role}/preview` },
         { name: "Connect", path: "/connect", icon: UserIcon, id: `/${role}/connect` },
       ]
    }
  ] : [
    {
       label: "Core",
       defaultOpen: true,
       items: [
         { name: "Dashboard", path: "/dashboard", icon: LayoutDashboardIcon, id: "dashboard" },
         { name: "Profile", path: "/profile", icon: UserIcon, id: `/${role}/profile` },
       ]
    },
    {
       label: "Academics",
       defaultOpen: true,
       items: [
         { name: "My Workspace", path: "/dashboard/workspaces", icon: MonitorPlay, id: `/${role}/dashboard/workspaces` },
         { name: "Library", path: "/library", icon: BookOpenIcon, id: `/${role}/library` },
         { name: "CBT", path: "/cbt", icon: ClipboardIcon, id: `/${role}/cbt` },
         { name: "Saved", path: "/saved", icon: BookmarkIcon, id: `/${role}/saved"` },
       ]
    },
    {
       label: "Community",
       defaultOpen: false,
       items: [
         { name: "Leaderboard", path: "/dashboard/leaderboard", icon: Medal, id: `/${role}/dashboard/leaderboard` },
         { name: "Ask Seniors", path: "/dashboard/ask-seniors", icon: Sparkles, id: `/${role}/dashboard/ask-seniors` },
         { name: "Connect", path: "/connect", icon: UserIcon, id: `/${role}/connect` },
       ]
    },
    {
       label: "Discover",
       defaultOpen: false,
       items: [
         { name: "Opportunities", path: "/dashboard/opportunities", icon: Briefcase, id: `/${role}/dashboard/opportunities` },
         { name: "Dept Preview", path: "/preview", icon: BookOpenIcon, id: `/${role}/preview` },
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
            <XIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      </div>

      <aside
        className={`fixed top-0 left-0 w-80 bg-[#f9f9fb] dark:bg-zinc-900 h-screen p-4 z-40 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 md:static`}
      >
        <div className="flex flex-col gap-5 h-full relative">
          <div className="w-full">
            <Image
              src="/univault.png"
              alt="Univault Logo"
              className="mx-auto"
              width={150}
              height={50}
              priority
            />
          </div>
          <hr className="border-t border-zinc-300 dark:border-zinc-700 opacity-30 my-2" />

          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            <Accordion type="multiple" defaultValue={defaultValues} className="w-full space-y-2">
              {menuGroupings.map((group) => (
                <AccordionItem value={group.label} key={group.label} className="border-none">
                  <AccordionTrigger className="py-2 px-4 hover:no-underline rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {group.label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-1 space-y-1">
                    {group.items.map(({ name, icon: Icon, id, path }) => {
                      const isActive = active === id;
                      return (
                        <div
                          key={id}
                          onClick={() => handleNavigation(id, path)}
                          className={`flex items-center gap-3 py-2.5 px-4 rounded-xl cursor-pointer transition-all duration-300 ${
                            isActive
                              ? "bg-white dark:bg-zinc-800 shadow-sm border border-blue-500 text-blue-600 dark:text-blue-400"
                              : "hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                        >
                          <div
                            className={`h-7 w-7 flex items-center justify-center rounded-lg ${
                              isActive
                                ? "bg-blue-100 dark:bg-blue-900/50"
                                : "bg-zinc-100 dark:bg-zinc-900"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`font-poppins text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
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

          {/* Admin & Faculty Rep Links */}
          {(role === "admin" || role === "faculty-rep") && (
            <div
              onClick={() => router.push(role === "admin" ? "/admin/data" : `/${role}/data/departments/${userData?.departmentId}`)}
              className="flex gap-3 font-poppins text-xs items-center cursor-pointer mt-auto"
            >
              <div className="h-9 w-9 flex items-center justify-center rounded-full p-2 bg-white dark:bg-zinc-800 text-[#1E3A8A] dark:text-blue-300">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-700 dark:text-zinc-200">Manage Data</h3>
            </div>
          )}

          {/* Compact Faculty Rep Widget at the bottom */}
          <SidebarRepWidget />
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={toggle}
        />
      )}

      {/* <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 flex justify-around items-center py-5 !z-100">
        {menuItems.slice(0, 4).map(({ id, icon: Icon, path }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigation(id, path)}
              className="flex flex-col items-center text-xs"
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? "text-blue-500"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              />
            </button>
          );
        })}
        {user && (
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
            <Image
              src={user.imageUrl}
              alt={"user image"}
              title="My profile"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              fill
              className="object-cover"
            />
          </div>
        )}
      </nav> */}
      {dropdownOpen && (
        <div className="sm:hidden fixed bottom-16 left-0 w-full bg-white dark:bg-zinc-900 shadow-lg rounded-t-xl p-4 z-50">
          {" "}
          <Image
            src={"/icons/logout.svg"}
            alt="logout"
            width={20}
            height={20}
            className="cursor-pointer ml-auto"
            onClick={() => {
              signOut();
              localStorage.setItem(STORAGE_KEY, "[]");
            }}
          />
        </div>
      )}
    </>
  );
};

export default Sidebar;
