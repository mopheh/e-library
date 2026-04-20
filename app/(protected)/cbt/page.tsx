"use client";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import CbtContainer from "@/components/Dashboard/cbt/CbtContainer";
import AspirantCbt from "@/components/aspirant/AspirantCbt";

export default function Page() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
     return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
           <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
     );
  }

  const role = user?.unsafeMetadata?.role as string;

  if (role === "aspirant") {
    return <AspirantCbt />;
  }
  
  // Default to STUDENT layer
  return <CbtContainer />;
}
