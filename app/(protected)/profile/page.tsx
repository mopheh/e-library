"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2Icon, LogOut } from "lucide-react";
import { UserProfile, useAuth } from "@clerk/nextjs";
import { useUserData } from "@/hooks/useUsers";
import { STORAGE_KEY } from "@/lib/utils";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import ProfileOverview from "@/components/profile/ProfileOverview";
import ProfileForm from "@/components/profile/ProfileForm";
import ActivityHistory from "@/components/profile/ActivityHistory";
import PreferencesSettings from "@/components/profile/PreferencesSettings";
import AspirantProfile from "@/components/aspirant/AspirantProfile";

export default function ProfilePage() {
  const { data: userData, isLoading: userLoading } = useUserData();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = () => {
    signOut();
    localStorage.setItem(STORAGE_KEY, "[]");
  };

  const role = userData?.role?.toLowerCase() || "";
  const isAspirant = role === "aspirant";

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAspirant) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isAspirant]);

  if (userLoading || (loading && !isAspirant && !profile)) {
    return (
      <div className="flex fixed inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-50 h-screen w-full justify-center items-center">
        <Loader2Icon className="w-10 h-10 animate-spin text-zinc-900 dark:text-zinc-100" />
      </div>
    );
  }

  // Aspirants get their own dedicated profile experience
  if (isAspirant) {
    return <AspirantProfile />;
  }

  return (
    <div className="max-w-6xl mx-auto px-3 py-4 sm:p-4 md:p-6 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Profile
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
          Manage your personal information, academic details, and security settings.
        </p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 w-full overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap h-auto md:h-12 md:max-w-fit md:inline-flex rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg py-2 px-3 sm:px-4 text-xs sm:text-sm shadow-none data-[state=active]:shadow-sm shrink-0">
            Overview
          </TabsTrigger>
          <TabsTrigger value="edit" className="rounded-lg py-2 px-3 sm:px-4 text-xs sm:text-sm shadow-none data-[state=active]:shadow-sm shrink-0">
            Edit
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg py-2 px-3 sm:px-4 text-xs sm:text-sm shadow-none data-[state=active]:shadow-sm shrink-0">
             Activity
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg py-2 px-3 sm:px-4 text-xs sm:text-sm shadow-none data-[state=active]:shadow-sm shrink-0">
             Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg py-2 px-3 sm:px-4 text-xs sm:text-sm shadow-none data-[state=active]:shadow-sm shrink-0">
            Security
          </TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TabsContent value="overview">
            <ProfileOverview profile={profile} />
          </TabsContent>

          <TabsContent value="edit">
            <div className="max-w-3xl">
               <ProfileForm profile={profile} onSaved={loadProfile} />
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="max-w-3xl">
               <ActivityHistory activities={profile?.recentActivities || []} />
            </div>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="max-w-3xl">
               <PreferencesSettings />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
             <div className="max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sign out</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    End your session on this device.
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
             </div>

             <div className="flex justify-start w-full">
                <UserProfile routing="hash" />
             </div>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
