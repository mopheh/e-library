"use client";

import React from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Bell, Sparkles } from "lucide-react";

export default function MobileHeader() {
  const { user, isLoaded } = useUser();

  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-transparent">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-zinc-200 shadow-sm">
          {isLoaded && user?.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt="User Avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-200 animate-pulse" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-500">Hello,</span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 -mt-1 tracking-tight">
            {isLoaded ? user?.fullName || "Student" : "..."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 transition-colors text-white px-3 py-1.5 rounded-full shadow-md text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Go Pro
        </button>
        <button className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <Bell className="w-6 h-6 text-zinc-700 dark:text-zinc-300" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-zinc-900" />
        </button>
      </div>
    </div>
  );
}
