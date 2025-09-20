"use client";

import { JSX, useEffect, useState } from "react";
import {
  Loader2,
  LogIn,
  BookOpen,
  Download,
  ClipboardList,
  FileText,
  Bot,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Activity type
type Activity = {
  id: string;
  type: "LOGIN" | "READ" | "DOWNLOAD" | "CBT" | "ONBOARDING";
  message: string;
  time: string;
  book?: any;
  meta?: any;
  createdAt: string;
};

const activityIcons: Record<Activity["type"], JSX.Element> = {
  LOGIN: <LogIn className="h-4 w-4 text-blue-500" />,
  READ: <BookOpen className="h-4 w-4 text-emerald-500" />,
  DOWNLOAD: <Download className="h-4 w-4 text-orange-500" />,
  CBT: <ClipboardList className="h-4 w-4 text-purple-500" />,
  ONBOARDING: <UserPlus className="h-4 w-4 text-pink-500" />,
};
const ActivityItem = ({
  type,
  message,
  time,
}: {
  type: "LOGIN" | "READ" | "DOWNLOAD" | "CBT" | "ONBOARDING";
  message: string;
  time: string;
}) => {
  const icons: Record<Activity["type"], JSX.Element> = {
    LOGIN: <LogIn className="h-4 w-4 text-blue-500" />,
    READ: <BookOpen className="h-4 w-4 text-emerald-500" />,
    DOWNLOAD: <Download className="h-4 w-4 text-orange-500" />,
    CBT: <ClipboardList className="h-4 w-4 text-purple-500" />,
    ONBOARDING: <UserPlus className="h-4 w-4 text-pink-500" />,
  };

  return (
    <div className="relative flex gap-3 pl-12 pb-6 last:pb-0">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800"></div>

      <div className="absolute left-2 top-0 flex items-center p-2 justify-center rounded-full bg-white dark:bg-zinc-950 shadow-sm border">
        {icons[type]}
      </div>

      <div>
        <p className="text-xs font-poppins dark:text-white">{message}</p>
        <span className="text-[12px] text-zinc-500 font-poppins">{time}</span>
      </div>
    </div>
  );
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch("/api/activity");
        const data = await res.json();
        console.log(data);
        setActivities(data);
      } catch (err) {
        console.error("Error fetching activities", err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  return (
    <div className="bg-white mt-5 dark:bg-zinc-950 rounded-lg w-full lg:w-1/3 p-3 h-[300px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold font-open-sans">Recent Activities</h3>
      </div>
      <div className="relative">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
          </div>
        ) : activities.length > 0 ? (
          activities.map((a) => (
            <ActivityItem
              key={a.id}
              type={a.type}
              message={
                a.type === "READ"
                  ? `You read ${a.book?.title} (${a.meta?.pagesRead} pages)`
                  : a.type === "DOWNLOAD"
                    ? `You downloaded ${a.book?.title}`
                    : a.type === "CBT"
                      ? `You completed CBT with score ${a.meta?.score}%`
                      : a.type === "ONBOARDING"
                        ? "You completed onboarding 🎉"
                        : "You logged in"
              }
              time={formatDistanceToNow(new Date(a.createdAt), {
                addSuffix: true,
              })}
            />
          ))
        ) : (
          <div className="text-center font-light text-xs text-muted-foreground py-6 font-poppins">
            No recent activities yet.
          </div>
        )}
      </div>
    </div>
  );
}
