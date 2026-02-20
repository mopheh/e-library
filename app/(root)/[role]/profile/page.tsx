"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    loadProfile();
  }, []);

  if (loading && !profile) {
    return (
      <div className="flex fixed inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-50 h-screen w-full justify-center items-center">
        <Loader2Icon className="w-10 h-10 animate-spin text-zinc-900 dark:text-zinc-100" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Profile
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal information, academic details, and security settings.
        </p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 w-full flex-wrap h-auto md:h-12 md:max-w-fit md:inline-flex rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg py-2 px-4 shadow-none data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="edit" className="rounded-lg py-2 px-4 shadow-none data-[state=active]:shadow-sm">
            Edit Profile
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg py-2 px-4 shadow-none data-[state=active]:shadow-sm">
             Activity & Stats
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg py-2 px-4 shadow-none data-[state=active]:shadow-sm">
             Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg py-2 px-4 shadow-none data-[state=active]:shadow-sm">
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

          <TabsContent value="security">
             <div className="flex justify-start w-full">
                <UserProfile routing="hash" />
             </div>
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
