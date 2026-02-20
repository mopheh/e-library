import React from "react";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, BrainCircuit, Activity, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ActivityHistoryProps {
  activities: any[];
}

export default function ActivityHistory({ activities }: ActivityHistoryProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-zinc-500">
          <Activity className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" />
          <p>No recent activity to show.</p>
        </CardContent>
      </Card>
    );
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "read_book":
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case "download_book":
        return <Download className="w-4 h-4 text-purple-500" />;
      case "ai_request":
        return <BrainCircuit className="w-4 h-4 text-rose-500" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-500" />;
    }
  };

  const formatActivityMessage = (act: any) => {
    switch (act.type) {
      case "read_book":
        return "Started reading a new book or document.";
      case "download_book":
        return "Downloaded a document for offline reading.";
      case "ai_request":
        return "Interacted with the AI Study Assistant.";
      case "completed_cbt":
        return `Completed a CBT assessment with score: ${act.meta?.score || 0}.`;
      default:
        return "Performed an action.";
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and progress.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 space-y-6">
            {activities.map((act) => (
                <div key={act.id} className="relative pl-6">
                <div className="absolute -left-3 top-1 bg-white dark:bg-zinc-950 p-1 rounded-full border border-zinc-200 dark:border-zinc-800">
                    {getIconForType(act.type)}
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatActivityMessage(act)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </p>
                </div>
                </div>
            ))}
            </div>
      </CardContent>
    </Card>
  );
}
