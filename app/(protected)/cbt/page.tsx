"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

// Only one of these ever renders for a given user (role is fixed per
// account), so loading both statically shipped ~1,200 lines of unused CBT
// UI to every student and every aspirant alike.
const CbtContainer = dynamic(() => import("@/components/Dashboard/cbt/CbtContainer"), {
  ssr: false,
  loading: LoadingSpinner,
});
const AspirantCbt = dynamic(() => import("@/components/aspirant/AspirantCbt"), {
  ssr: false,
  loading: LoadingSpinner,
});

export default function Page() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  const role = user?.unsafeMetadata?.role as string;

  if (role === "aspirant") {
    return <AspirantCbt />;
  }

  // Default to STUDENT layer
  return <CbtContainer />;
}
