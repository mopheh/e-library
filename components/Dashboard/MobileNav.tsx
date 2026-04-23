"use client";

import React, { RefObject, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  User,
  Users2,
  Menu,
} from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

export default function BottomNav({
  scrollRef,
  toggleSidebar,
}: {
  scrollRef?: RefObject<HTMLElement | null>;
  toggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(pathname);
  const keyboardOpen = useKeyboardOpen();

  useEffect(() => {
    setActive(pathname);
  }, [pathname]);

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const menuItems = [
    {
      name: "Home",
      path: "/dashboard",
      icon: LayoutDashboard,
      id: "/dashboard",
    },
    {
      name: "Learn",
      path: "/library",
      icon: BookOpen,
      id: "/library",
    },
    {
      name: "Study",
      path: "/cbt",
      icon: ClipboardList,
      id: "/cbt",
    },
    {
      name: "Community",
      path: "/dashboard/ask-seniors",
      icon: Users2,
      id: "/dashboard/ask-seniors",
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
      id: "/profile",
    },
  ];

  const HIDDEN_ROUTES = ["/cbt", "/book", "/library/read", "/viewer", "/dashboard/workspaces", "/dashboard/study-rooms"];
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
        visible: { y: 0, opacity: 1 },
        hidden: { y: "100%", opacity: 0 },
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-morphism rounded-[2rem] border border-white/20 dark:border-white/10 flex justify-around items-center py-3.5 px-2 !z-[100] shadow-2xl"
    >
      {menuItems.map(({ name, icon: Icon, path, id }) => {
        const isActive = pathname === id || (id !== "/dashboard" && pathname.startsWith(id));
        return (
          <button
            key={id}
            onClick={() => handleNavigation(path)}
            className="flex flex-col items-center relative transition-all active:scale-90"
          >
            <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none -mt-8" : "text-zinc-500 dark:text-zinc-400"}`}>
               <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
            </div>
            <span className={`text-[9px] mt-1 font-bold ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"}`}>
              {name}
            </span>
          </button>
        );
      })}
      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center transition-all active:scale-90"
      >
        <div className="p-2 text-zinc-500 dark:text-zinc-400">
           <Menu className="w-5 h-5" />
        </div>
        <span className="text-[9px] mt-1 font-bold text-zinc-500 dark:text-zinc-400">
          Menu
        </span>
      </button>
    </motion.nav>
  );
}
