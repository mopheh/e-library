"use client";

import React, { Suspense, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { UserProfile, useAuth } from "@clerk/nextjs";
import { cn, STORAGE_KEY } from "@/lib/utils";
import { useUserData } from "@/hooks/useUsers";
import { type ProfileUpdate, useProfile } from "@/hooks/useProfile";
import { removePushSubscription } from "@/hooks/usePushNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileOverview, { card, type GoTo } from "@/components/profile/ProfileOverview";
import ProfileForm from "@/components/profile/ProfileForm";
import ActivityHistory from "@/components/profile/ActivityHistory";
import PreferencesSettings from "@/components/profile/PreferencesSettings";
import AspirantProfile from "@/components/aspirant/AspirantProfile";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "edit", label: "Edit details" },
  { id: "activity", label: "Activity" },
  { id: "preferences", label: "Preferences" },
  { id: "account", label: "Account" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const isTab = (v: string | null): v is TabId => TABS.some((t) => t.id === v);

function ProfileSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] animate-pulse" aria-busy="true" aria-label="Loading profile">
      <div className="space-y-5">
        <div className={cn(card, "h-56")} />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className={cn(card, "h-36")} />)}
        </div>
        <div className={cn(card, "h-64")} />
      </div>
      <div className="space-y-5">
        <div className={cn(card, "h-96")} />
      </div>
    </div>
  );
}

function StudentProfile() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { signOut } = useAuth();
  const { data: profile, isLoading, isError, refetch, isRefetching } = useProfile();

  const tab: TabId = isTab(params.get("tab")) ? (params.get("tab") as TabId) : "overview";
  const focusField = (params.get("field") ?? undefined) as keyof ProfileUpdate | undefined;

  const goTo: GoTo = useCallback(
    (next, field) => {
      const q = new URLSearchParams();
      if (next !== "overview") q.set("tab", next);
      if (field) q.set("field", field);
      router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, pathname],
  );

  const handleSignOut = () => {
    localStorage.setItem(STORAGE_KEY, "[]");
    removePushSubscription().finally(() => signOut());
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:p-6 font-poppins">
      <header className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50">Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">Your details, academic record and settings in one place.</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => goTo(v as TabId)} className="space-y-5 sm:space-y-6">
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
          <TabsList className="h-auto p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 inline-flex w-max">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="rounded-lg py-2 px-3.5 text-xs sm:text-sm shadow-none data-[state=active]:shadow-sm"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : isError || !profile ? (
          <div className={cn(card, "p-10 text-center")}>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Couldn&apos;t load your profile</p>
            <p className="text-xs text-zinc-500 mt-1">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} /> Try again
            </button>
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="mt-0">
              <ProfileOverview profile={profile} goTo={goTo} />
            </TabsContent>

            <TabsContent value="edit" className="mt-0 max-w-3xl">
              <ProfileForm profile={profile} focusField={focusField} onOpenAccount={() => goTo("account")} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0 max-w-3xl">
              <div className={cn(card, "p-5 sm:p-6")}>
                <p className="text-xs text-zinc-500 mb-5">
                  Your latest reading, logged study and CBTs. Full charts are on{" "}
                  <Link href="/dashboard/progress" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Progress</Link>.
                </p>
                <ActivityHistory items={profile.timeline} />
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-0 max-w-3xl">
              <PreferencesSettings />
            </TabsContent>

            <TabsContent value="account" className="mt-0 space-y-5">
              <div className={cn(card, "max-w-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3")}>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sign out</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">End your session on this device.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
              <p className="text-xs text-zinc-500 max-w-3xl">
                Photo, email, password and connected devices are managed below.
              </p>
              <div className="w-full overflow-x-auto">
                <UserProfile routing="hash" />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  const { data: userData, isLoading } = useUserData();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4 sm:p-6">
        <ProfileSkeleton />
      </div>
    );
  }

  // Aspirants get their own dedicated profile experience
  if (userData?.role?.toLowerCase() === "aspirant") {
    return <AspirantProfile />;
  }

  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-4 sm:p-6"><ProfileSkeleton /></div>}>
      <StudentProfile />
    </Suspense>
  );
}
