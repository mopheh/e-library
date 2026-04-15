"use client";

import React from "react";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";

export default function LastReadFeed() {
  const { data: dashboardData } = useDashboard();
  const recentBooks = dashboardData?.books?.slice(0, 5) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-lg font-bold font-poppins text-zinc-800 dark:text-zinc-200">
          Last Read
        </h3>
        <button className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4">
        {recentBooks.length > 0 ? (
          recentBooks.map((book: any, i: number) => (
            <Link key={i} href={`/book/${book.id}`}>
              <div className="glass-card flex items-center gap-4 p-4 min-w-[280px] rounded-2xl hover:shadow-lg transition-all group">
                <div className="relative w-16 h-20 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <Image
                    src={book.coverUrl || "/placeholder-book.jpg"}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 truncate mb-1">
                    {book.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>2h ago</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-sm text-zinc-400 py-10 px-4 text-center w-full">
            No recently read books found.
          </div>
        )}
      </div>
    </div>
  );
}
