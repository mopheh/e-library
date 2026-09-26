
"use client";
import { useEffect } from "react";
// Side-effect import: starts listening for beforeinstallprompt app-wide.
import "@/hooks/useInstallPrompt";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", async () => {
                try {
                    const reg = await navigator.serviceWorker.register("/sw.js");
                    console.log("SW registered:", reg);
                } catch (err) {
                    console.error("SW registration failed:", err);
                }
            });
        }
    }, []);

    return null;
}
