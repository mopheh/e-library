import React from "react";
import { db } from "@/database/drizzle";
import { eq, desc } from "drizzle-orm";
import { resourceRequests, users } from "@/database/schema";
import { Search, Plus, BookOpen, Clock, CheckCircle } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { User } from "@/types";

export default async function ResourceRequestsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  });

  if (!dbUser) return null;

  const requests = await db.query.resourceRequests.findMany({
    where: eq(resourceRequests.departmentId, dbUser.departmentId),
    with: {
      user: true,
      course: true,
    },
    orderBy: [desc(resourceRequests.createdAt)],
    limit: 50,
  });

  return (
    <div className="p-4 md:p-8 space-y-8 font-poppins bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resource Requests</h1>
          <p className="text-zinc-500 mt-2">
            Ask for specific past questions or textbooks. Faculty reps will fulfill them.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-5 h-5" /> Request Material
        </button>
      </div>

      {/* Stats/Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by course code (e.g. MTH101)..."
            className="bg-transparent border-none outline-none w-full text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
            <BookOpen className="w-10 h-10 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <h3 className="text-xl font-medium mb-2">No Requests Yet</h3>
            <p className="text-zinc-500">
              Can&apos;t find what you need? Be the first to submit a material request!
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {req.status === "FULFILLED" && (
                 <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                    FULFILLED
                 </div>
              )}
              {req.status === "PENDING" && (
                 <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                    PENDING
                 </div>
              )}
              
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                   <BookOpen className="w-5 h-5" /> {req.course?.courseCode || "N/A"}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {req.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold">
                    {(req.user as User | null)?.fullName?.charAt(0) || "U"}
                  </div>
                  {(req.user as User | null)?.fullName?.split(" ")[0] || "Unknown"}
                </div>
                <div className="flex items-center gap-1">
                   <Clock className="w-3.5 h-3.5" />
                   {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
