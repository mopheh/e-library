import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Download, BrainCircuit, Clock, Layers } from "lucide-react";
import Image from "next/image";

interface ProfileOverviewProps {
  profile: any;
}

export default function ProfileOverview({ profile }: ProfileOverviewProps) {
  const stats = profile?.stats || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 relative rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-4 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt="Profile Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-zinc-400">
                  {profile?.firstName?.charAt(0)}
                  {profile?.lastName?.charAt(0)}
                </span>
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                {profile?.email}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                {profile?.role && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {profile.role}
                  </span>
                )}
                {profile?.department?.name && (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-300">
                    {profile.department.name}
                  </span>
                )}
                {profile?.year && (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-300">
                    Level {profile.year}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Books Read"
          value={stats.booksRead}
          icon={<BookOpen className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          title="Minutes Read"
          value={stats.totalMinutes}
          icon={<Clock className="w-4 h-4 text-blue-500" />}
        />
        <StatCard
          title="Pages Read"
          value={stats.totalPages}
          icon={<Layers className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          title="Downloads"
          value={stats.downloads}
          icon={<Download className="w-4 h-4 text-purple-500" />}
        />
        <StatCard
          title="AI Requests"
          value={stats.aiRequests}
          icon={<BrainCircuit className="w-4 h-4 text-rose-500" />}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-zinc-600 dark:text-zinc-400">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {value || 0}
        </div>
      </CardContent>
    </Card>
  );
}
