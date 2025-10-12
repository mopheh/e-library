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
} from "lucide-react";
import { ModeToggle } from "../toggle";
import { useAuth, useUser } from "@clerk/nextjs";
import { STORAGE_KEY } from "@/lib/utils";

interface SidebarProps {
  role?: string;
  isOpen?: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const { user } = useUser();
  const { signOut } = useAuth();
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
      id: `/${role}/saved"`,
    },
    { name: "CBT", path: "/cbt", icon: ClipboardIcon, id: `/${role}/cbt` },
    {
      name: "Profile",
      path: "/profile",
      icon: UserIcon,
      id: `/${role}/profile`,
    },
  ];
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

          <nav className="flex flex-col gap-2">
            {menuItems.map(({ name, icon: Icon, id, path }) => {
              const isActive = active === id;
              return (
                <div
                  key={id}
                  onClick={() => handleNavigation(id, path)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-white dark:bg-zinc-800 shadow"
                      : "rounded-full"
                  }`}
                >
                  <div
                    className={`h-8 w-8 flex items-center justify-center rounded-full p-2 ${
                      isActive
                        ? "bg-[#3b82f6] text-white"
                        : "bg-white dark:bg-zinc-800 text-[#3b82f6] dark:text-blue-400 shadow"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`font-poppins text-xs ${
                      isActive
                        ? "text-zinc-700 dark:text-zinc-100 font-medium"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {name}
                  </span>
                </div>
              );
            })}
          </nav>

          {/* Admin Link */}
          {role === "admin" && (
            <div
              onClick={() => router.push("/admin/data")}
              className="flex gap-3 font-poppins text-xs items-center cursor-pointer mt-auto"
            >
              <div className="h-9 w-9 flex items-center justify-center rounded-full p-2 bg-white dark:bg-zinc-800 text-[#1E3A8A] dark:text-blue-300">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-700 dark:text-zinc-200">Manage Data</h3>
            </div>
          )}
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
          onClick={toggle}
        />
      )}

      <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 flex justify-around items-center py-5 !z-100">
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
      </nav>
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
