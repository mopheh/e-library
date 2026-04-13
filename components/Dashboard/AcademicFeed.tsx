"use client";

import React, { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, MessageSquare, Loader2, Quote, ArrowRight } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

interface FeedItem {
  itemId: string;
  type: "BOOK" | "THREAD" | "GUIDE";
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetId: string;
}

export const AcademicFeed = () => {
  const { ref, inView } = useInView();

  const fetchFeed = async ({ pageParam = 1 }) => {
    const res = await fetch(`/api/feed?page=${pageParam}&limit=10`);
    if (!res.ok) throw new Error("Failed to load feed");
    return res.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["academicFeed"],
    queryFn: fetchFeed,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl">
        Error loading your academic feed.
      </div>
    );
  }

  const items = data?.pages.flatMap((page) => page.items) as FeedItem[];

  if (items.length === 0) {
    return (
      <div className="p-12 text-center bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
        <h3 className="text-lg font-medium mb-2 font-poppins">No Activity Yet</h3>
        <p className="text-muted-foreground font-open-sans">
          Your department feed is quiet. Start a discussion or upload a material to kick things off!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold font-poppins">Recent Updates</h3>
      </div>
      
      <div className="space-y-4">
        {items.map((item, i) => (
          <FeedCard key={`${item.itemId}-${i}`} item={item} />
        ))}
      </div>

      <div ref={ref} className="py-4 flex justify-center">
        {isFetchingNextPage ? (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        ) : hasNextPage ? (
          <span className="text-sm text-muted-foreground">Scroll for more...</span>
        ) : (
          <span className="text-sm border-t border-gray-200 dark:border-zinc-800 pt-6 mt-4 w-full text-center text-muted-foreground">
            You've caught up with all updates!
          </span>
        )}
      </div>
    </div>
  );
};

const FeedCard = ({ item }: { item: FeedItem }) => {
  const getIcon = () => {
    switch (item.type) {
      case "BOOK":
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case "THREAD":
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case "GUIDE":
        return <Quote className="w-5 h-5 text-emerald-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionText = () => {
    switch (item.type) {
      case "BOOK":
        return "uploaded a new material";
      case "THREAD":
        return "started a new discussion";
      case "GUIDE":
        return "published a survival guide";
      default:
        return "shared an update";
    }
  };

  const getHref = () => {
    switch (item.type) {
      case "BOOK":
        return `/dashboard/book/${item.targetId}`; // targetId is bookId
      case "THREAD":
        return `/dashboard/workspaces/${item.targetId}?tab=discussions`; // targetId is courseId
      case "GUIDE":
        return `/dashboard/workspaces/${item.targetId}?tab=guides`; // targetId is courseId
      default:
        return "#";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-gray-100 dark:border-zinc-800">
            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold dark:bg-indigo-900/40 dark:text-indigo-300">
              {item.authorName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold font-poppins text-foreground">
              {item.authorName} <span className="font-normal text-muted-foreground">{getActionText()}</span>
            </p>
            <p className="text-xs text-muted-foreground font-open-sans">
              {formatDistanceToNow(new Date(item.createdAt))} ago
            </p>
          </div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full">
          {getIcon()}
        </div>
      </div>

      <div className="mt-4 mb-5">
        <h4 className="font-bold text-base font-poppins mb-1 text-foreground line-clamp-1">
          {item.title}
        </h4>
        {item.content && (
          <p className="text-sm text-slate-600 dark:text-slate-400 font-open-sans line-clamp-2">
            {item.content}
          </p>
        )}
      </div>

      <Link href={getHref()} className="inline-block mt-2">
        <Button variant="outline" size="sm" className="font-semibold rounded-xl text-xs">
          View Details <ArrowRight className="w-3.5 h-3.5 ml-2" />
        </Button>
      </Link>
    </div>
  );
};
