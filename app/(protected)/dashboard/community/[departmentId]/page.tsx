import React from "react";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
import { departments, users, faculty } from "@/database/schema";
import { Users, BookOpen, MessageCircle, Info, Star } from "lucide-react";
import Image from "next/image";

export default async function DepartmentCommunityPage(props: {
  params: Promise<{ departmentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const { departmentId } = params;
  const department = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
    with: {
      faculty: true,
    },
  });

  const members = await db.query.users.findMany({
    where: eq(users.departmentId, departmentId),
    limit: 12,
  });

  if (!department) {
    return (
      <div className="p-8 text-center text-zinc-500 font-poppins">
        Department not found.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 font-poppins bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-50 z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
              <Star className="w-4 h-4" /> Official Community
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-open-sans mb-2">
              {department.name}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              {department.faculty?.name || "Faculty"} • {members.length} Members
            </p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105 shadow-md flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Start Discussion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-500" /> Recent
              Discussions
            </h3>
            <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
              <p>No recent discussions. Be the first to start one!</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" /> About
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Welcome to the official {department.name} learning community. Share
              materials, discuss past questions, and help your peers succeed.
            </p>

            <h4 className="font-semibold text-sm mb-3">Community Members</h4>
            <div className="flex flex-wrap gap-2">
              {members.length > 0 ? (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400 text-xs border border-white dark:border-zinc-950 shadow-sm"
                    title={m.fullName}
                  >
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt={m.fullName || "Member"} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      m.fullName?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                ))
              ) : (
                <span className="text-sm text-zinc-500">No members yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
