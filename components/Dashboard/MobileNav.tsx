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
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

export default function BottomNav({
  scrollRef,
}: {
  scrollRef?: RefObject<HTMLElement | null>;
}) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { role } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(pathname);
  const keyboardOpen = useKeyboardOpen();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNavigation = (id: string, route: string) => {
    setActive(id);
    router.push(`/${role}/${route}`);
    // toggle();
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
      id: `/${role}/library`,
    },
    {
      name: "Saved",
      path: "/saved",
      icon: BookmarkIcon,
      id: `/${role}/saved`,
    },
    { name: "CBT", path: "/cbt", icon: ClipboardIcon, id: `/${role}/cbt` },
    {
      name: "Profile",
      path: "/profile",
      icon: UserIcon,
      id: `/${role}/profile`,
    },
  ];
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

  return (
    <motion.nav
      initial={false}
      animate={shouldHide ? "hidden" : "visible"}
      variants={{
        visible: { y: 0 },
        hidden: { y: "100%" },
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sm:hidden pb-[env(safe-area-inset-bottom)] fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 flex justify-around items-center py-5 !z-[100]"
    >
      <>
        {menuItems.map(({ id, icon: Icon, path }) => {
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
      </>
    </motion.nav>
  );
}
