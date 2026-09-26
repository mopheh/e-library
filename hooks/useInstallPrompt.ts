"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Chrome fires beforeinstallprompt once, early - often before the component
// that wants to show an "Install" button has mounted. Capture it at module
// level (ServiceWorkerRegister imports this from the root layout) and let
// hooks read it later.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

/** Android/desktop Chrome only; iOS has no programmatic install. */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const update = () => setCanInstall(deferred !== null);
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    listeners.forEach((l) => l());
    return outcome === "accepted";
  };

  return { canInstall, install };
}
