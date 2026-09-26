"use client";

import { useCallback, useEffect, useState } from "react";

export type PushStatus =
  | "loading"
  | "unsupported" // browser can't do web push at all
  | "needs-install" // iOS Safari: push only works once added to Home Screen
  | "denied" // user blocked notifications in browser settings
  | "off" // supported, not subscribed on this device
  | "on"; // subscribed on this device

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function pushSupported() {
  return typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
}

async function getRegistration() {
  // navigator.serviceWorker.ready never resolves if no SW is registered
  // (e.g. dev, where next-pwa is disabled) - don't hang the UI on it.
  const existing = await navigator.serviceWorker.getRegistration();
  return existing ? navigator.serviceWorker.ready : null;
}

/**
 * Best-effort removal of this device's subscription - call before signOut so
 * a shared phone stops receiving the previous user's notifications.
 */
export async function removePushSubscription() {
  const work = (async () => {
    if (!pushSupported()) return;
    const reg = await getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe();
  })().catch(() => {});
  // Never hold up sign-out on a slow network
  await Promise.race([work, new Promise((r) => setTimeout(r, 2000))]);
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!pushSupported()) {
      setStatus(isIOS() && !isStandalone() ? "needs-install" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const reg = await getRegistration();
    if (!reg) {
      setStatus("unsupported");
      return;
    }
    const sub = await reg.pushManager.getSubscription();
    setStatus(sub && Notification.permission === "granted" ? "on" : "off");
  }, []);

  useEffect(() => {
    refresh().catch(() => setStatus("unsupported"));
  }, [refresh]);

  /** Must be called from a user gesture (click) - iOS rejects otherwise. */
  const enable = useCallback(async () => {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key || !pushSupported()) return false;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return false;
      }
      const reg = await getRegistration();
      if (!reg) {
        setStatus("unsupported");
        return false;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        }));
      const res = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Failed to save subscription");
      setStatus("on");
      return true;
    } catch (err) {
      console.error("Enabling push failed:", err);
      await refresh().catch(() => {});
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await removePushSubscription();
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, enable, disable };
}
