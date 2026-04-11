"use client";

import React, { RefObject, useEffect, useState } from "react";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import {
  BookOpenIcon,
  ClipboardIcon,
  LayoutDashboardIcon,
  UserIcon,
  MonitorPlay,
  Medal,
  Briefcase,
  Sparkles,
  Menu,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

export default function BottomNav({
  scrollRef,
  toggleSidebar,
}: {
  scrollRef?: RefObject<HTMLElement | null>;
  toggleSidebar: () => void;
}) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(pathname);
  const keyboardOpen = useKeyboardOpen();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNavigation = (id: string, route: string) => {
    setActive(id);
    router.push(route);
  };
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboardIcon,
      id: "dashboard",
    },
    {
      name: "Library",
      path: "/library",
      icon: BookOpenIcon,
      id: `/library`,
    },
    { name: "CBT", path: "/cbt", icon: ClipboardIcon, id: `/cbt` },
    {
      name: "Ask Seniors",
      path: "/dashboard/ask-seniors",
      icon: Sparkles,
      id: `/dashboard/ask-seniors`,
    },
  ];
  const HIDDEN_ROUTES = ["/cbt", `/book`, "/library/read", "/viewer", `/dashboard/courses`, `/dashboard/study-rooms`];
  const hardHide = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const shouldHide = hidden || keyboardOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollY } = useScroll(
    mounted && scrollRef ? { container: scrollRef } : undefined,
  );

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (previous === undefined) return;

    if (latest > previous && latest > 80) {
      setHidden(true);
    } else if (latest < previous) {
      setHidden(false);
    }
  });

  if (hardHide) return null;

  return (
    <motion.nav
      initial={false}
      animate={shouldHide ? "hidden" : "visible"}
      variants={{
        visible: { y: 0 },
        hidden: { y: "100%" },
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sm:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 flex justify-around items-center py-5 !z-[100]"
    >
      <>
        {menuItems.map(({ id, name, icon: Icon, path }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigation(id, path)}
              className="flex flex-col items-center text-xs"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive
                    ? "text-[#1E3A8A] dark:text-blue-400"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-[#1E3A8A] dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                {name}
              </span>
            </button>
          );
        })}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center text-xs"
        >
          <Menu className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
          <span className="text-[10px] mt-1 font-medium text-zinc-500 dark:text-zinc-400">
            Menu
          </span>
        </button>
      </>
    </motion.nav>
  );
}
