"use client";

import React from "react";
import { WifiOff } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export const OfflineIndicator = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-orange-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold text-sm">
        <WifiOff className="w-5 h-5 animate-pulse" />
        <div>
          <p>You are offline</p>
          <p className="text-orange-100 text-xs font-normal">Changes will sync when you reconnect.</p>
        </div>
      </div>
    </div>
  );
};
