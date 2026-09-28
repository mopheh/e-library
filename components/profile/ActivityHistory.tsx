"use client";

import React from "react";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { Activity as ActivityIcon, BookOpen, ClipboardCheck, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "@/lib/profile";
import { formatMinutes, STUDY_METHODS } from "@/components/study-log/LogStudySheet";

const METHOD_LABEL = Object.fromEntries(STUDY_METHODS.map((m) => [m.value, m.label]));

const KIND = {
  READ: { icon: BookOpen, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300" },
  LOGGED: { icon: NotebookPen, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300" },
  CBT: { icon: ClipboardCheck, tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
} as const;

function describe(item: TimelineItem): { title: string; detail: string } {
  switch (item.kind) {
    case "READ":
      return {
        title: `Read ${item.title}`,
        detail: [item.minutes ? formatMinutes(item.minutes) : "Under a minute", item.pages ? `${item.pages} page${item.pages === 1 ? "" : "s"}` : null]
          .filter(Boolean)
          .join(" · "),
      };
    case "LOGGED":
      return {
        title: `Studied ${item.title}`,
        detail: [`${item.timesRead}×`, item.minutes ? formatMinutes(item.minutes) : null, METHOD_LABEL[item.method] ?? item.method]
          .filter(Boolean)
          .join(" · "),
      };
    case "CBT":
      return { title: `${item.title} CBT`, detail: item.score != null ? `Scored ${item.score}%` : "Completed" };
  }
}

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, d MMM yyyy");
}

export default function ActivityHistory({ items, limit }: { items: TimelineItem[]; limit?: number }) {
  const list = limit ? items.slice(0, limit) : items;

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10 px-4">
        <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <ActivityIcon className="w-5 h-5 text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nothing here yet</p>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          Reading in the library, logging study and taking CBTs will show up here.
        </p>
        <Link href="/library" className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Open the library
        </Link>
      </div>
    );
  }

  const groups: { label: string; items: TimelineItem[] }[] = [];
  for (const item of list) {
    const label = dayLabel(new Date(item.at));
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.label}>
          <h4 className="text-[11px] font-semibold text-zinc-400 mb-2">{g.label}</h4>
          <ul className="space-y-1">
            {g.items.map((item, i) => {
              const { icon: Icon, tone } = KIND[item.kind];
              const { title, detail } = describe(item);
              return (
                <li key={`${item.kind}-${item.at}-${i}`} className="flex items-center gap-3 py-2">
                  <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", tone)}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{title}</p>
                    <p className="text-xs text-zinc-500">{detail}</p>
                  </div>
                  {item.kind !== "LOGGED" && (
                    <time className="text-[11px] text-zinc-400 tabular-nums shrink-0" dateTime={item.at}>
                      {format(new Date(item.at), "h:mm a")}
                    </time>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
