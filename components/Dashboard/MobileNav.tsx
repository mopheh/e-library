"use client";

import React, { RefObject, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  User,
  Users2,
  Layers,
} from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

const menuItems = [
  {
    name: "Home",
    path: "/dashboard",
    icon: LayoutDashboard,
    id: "/dashboard",
  },
  {
    name: "Library",
    path: "/library",
    icon: BookOpen,
    id: "/library",
  },
  {
    name: "Spaces",
    path: "/workspaces",
    icon: Layers,
    id: "/workspaces",
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

export default function BottomNav({
  scrollRef,
  toggleSidebar,
}: {
  scrollRef?: RefObject<HTMLElement | null>;
  toggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const keyboardOpen = useKeyboardOpen();

  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const shouldHide = hidden || keyboardOpen;

  useEffect(() => { setMounted(true); }, []);

  const HIDDEN_ROUTES = ["/cbt", "/book", "/library/read", "/viewer", "/dashboard/study-rooms"];
  const hardHide = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

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
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sm:hidden fixed bottom-0 left-0 right-0 !z-[100]"
    >
      {/* Frosted background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200/60 dark:border-white/[0.06]" />

      {/* Nav items */}
      <div className="relative flex items-center justify-around px-2 pt-2 pb-safe-or-3"
           style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {menuItems.map(({ name, icon: Icon, path, id }) => {
          const isActive =
            pathname === id ||
            (id !== "/dashboard" && pathname.startsWith(id));

          return (
            <button
              key={id}
              onClick={() => router.push(path)}
              className="flex flex-col items-center gap-1 min-w-[52px] py-1 px-1 relative group"
              aria-label={name}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-2xl bg-blue-50 dark:bg-blue-500/10"
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
              )}

              {/* Icon container */}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <div
                  className={`
                    w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                    ${isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-400 dark:text-zinc-500 group-active:scale-90"
                    }
                  `}
                >
                  <Icon
                    className={`transition-all duration-200 ${isActive ? "w-[22px] h-[22px]" : "w-[20px] h-[20px]"}`}
                    strokeWidth={isActive ? 2.3 : 1.8}
                  />
                </div>

                <span
                  className={`text-[9.5px] font-bold tracking-wide transition-all duration-200 font-cabin leading-none ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {name}
                </span>
              </div>

              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
