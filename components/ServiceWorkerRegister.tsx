"use client";
import { useEffect } from "react";
// Side-effect import: starts listening for beforeinstallprompt app-wide.
import "@/hooks/useInstallPrompt";
import { ensureServiceWorker } from "@/hooks/usePushNotifications";

// next-pwa's auto-registration doesn't run under the App Router, so the app
// registers /sw.js itself. This effect runs after hydration - usually AFTER
// the window "load" event has already fired - so it must not wait for
// "load" (that listener would never fire and the worker never registers,
// which silently broke offline mode and push). Register now if the page has
// loaded, otherwise as soon as it does.
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;
        const register = () => {
            ensureServiceWorker().catch((err) => console.error("SW registration failed:", err));
        };
        if (document.readyState === "complete") {
            register();
            return;
        }
        window.addEventListener("load", register, { once: true });
        return () => window.removeEventListener("load", register);
    }, []);

    return null;
}
