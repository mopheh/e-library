"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

export default function CurrentCourse() {
  const { data: dashboardData } = useDashboard();
  const recentBooks = dashboardData?.books?.slice(0, 3) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-lg font-bold font-poppins text-zinc-900 dark:text-zinc-100 tracking-tight">
          Current Course
        </h3>
        <Link href="/library" className="flex items-center text-[13px] font-semibold text-blue-600 hover:text-blue-700">
          View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4">
        {recentBooks.length > 0 ? (
          recentBooks.map((book: any, i: number) => (
            <Link key={i} href={`/book/${book.id}`} className="min-w-[260px] sm:min-w-[300px]">
              <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-[200px]">
                {/* Top Image Banner */}
                <div className="relative w-full h-28 bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  <Image
                    src={book.coverUrl || "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1600"}
                    alt={book.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Subtle gradient overlay at bottom of image for text readability if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                
                {/* Bottom Content Area */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                    {book.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                       <div className="bg-blue-600 h-full rounded-full" style={{ width: '45%' }} />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-500">45%</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
           <div className="w-full text-center py-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 mx-4">
              <p className="text-sm font-medium text-zinc-500">No active courses found.</p>
           </div>
        )}
      </div>
    </div>
  );
}
