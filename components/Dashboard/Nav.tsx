"use client";
import React, { useState, useEffect } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Search, SearchIcon } from "lucide-react";
import { BellIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useAuth, useUser } from "@clerk/nextjs";
import { STORAGE_KEY } from "@/lib/utils";
import { SearchCommand } from "./SearchCommand";

const Nav = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Toggle search with Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="hidden sm:flex w-full justify-between items-start sm:items-center mb-0 sm:mb-5 gap-2 sm:gap-4">
      <Breadcrumbs />
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center font-poppins">
        <button 
           onClick={() => setOpen(true)}
           className="group relative flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 w-56 transition-all shadow-sm"
        >
          <Search className="h-4 w-4" />
          <span className="inline-flex">Search...</span>
          <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-zinc-100 px-1.5 font-mono text-[10px] font-medium text-zinc-500 opacity-100 sm:flex dark:bg-zinc-800">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <SearchCommand open={open} setOpen={setOpen} />

        <div className="text-zinc-500 hidden dark:text-zinc-400 sm:flex items-center gap-3">
          {/* <BellIcon className="w-5 h-5" /> */}
          <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
            {user && (
              <>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                  <Image
                    src={user?.imageUrl}
                    alt={"user image"}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className=" text-[10px] sm:text-xs">
                  <h3 className="text-zinc-800 dark:text-zinc-200 font-medium">
                    {user?.fullName}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {user?.emailAddresses[0].emailAddress}
                  </p>
                </div>
                <Image
                  src={"/icons/logout.svg"}
                  alt={"logout"}
                  width={20}
                  height={20}
                  className="cursor-pointer"
                  onClick={() => {
                    signOut();
                    localStorage.setItem(STORAGE_KEY, "[]");
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Nav;
