"use client";

import { useEffect, useState } from "react";
import { BellRing, Download, PlusSquare, Share, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const SNOOZE_KEY = "push_prompt_snoozed_until";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
// Wait until the first-visit onboarding tour is done so we never stack a
// permission ask on top of it.
const TOUR_KEY = "rcf-dashboard-tour-done";

function readSnoozed() {
  try {
    if (localStorage.getItem(TOUR_KEY) !== "1") return true;
    return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

/**
 * Soft opt-in for push notifications. We only call the browser's permission
 * dialog after the student taps "Turn on" - a cold prompt on page load gets
 * denied, and a denial can't be re-asked from the page.
 * On iOS Safari (where push needs a Home Screen install) it shows install
 * steps instead.
 */
export function PushPrompt({ className }: { className?: string }) {
  const { status, busy, enable } = usePushNotifications();
  const { canInstall, install } = useInstallPrompt();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(readSnoozed());
  }, []);

  if (hidden || (status !== "off" && status !== "needs-install")) return null;

  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {}
    setHidden(true);
  };

  const turnOn = async () => {
    const ok = await enable();
    if (ok) {
      toast.success("Notifications are on", {
        description: "Fine-tune them anytime in Profile → Preferences.",
      });
    } else if (Notification.permission === "denied") {
      toast.error("Notifications are blocked", {
        description: "Allow them for this site in your browser settings, then try again.",
      });
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-zinc-900 p-4 sm:p-5 shadow-sm",
        className,
      )}
    >
      <button
        onClick={snooze}
        aria-label="Dismiss"
        className="absolute top-3 right-3 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
          <BellRing className="w-5 h-5" />
        </div>

        {status === "needs-install" ? (
          <div className="min-w-0">
            <h3 className="font-cabin font-black text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-50">
              Add RCF to your Home Screen
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              On iPhone, exam reminders and messages only reach you once the app is installed.
            </p>
            <ol className="mt-3 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold flex items-center justify-center">1</span>
                Tap <Share className="w-3.5 h-3.5 inline text-indigo-600" aria-label="Share" /> in Safari&apos;s toolbar
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold flex items-center justify-center">2</span>
                Choose <PlusSquare className="w-3.5 h-3.5 inline text-indigo-600" aria-hidden /> <b>Add to Home Screen</b>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold flex items-center justify-center">3</span>
                Open RCF from your Home Screen and turn on notifications
              </li>
            </ol>
          </div>
        ) : (
          <div className="min-w-0">
            <h3 className="font-cabin font-black text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-50">
              Never miss an exam or a reply
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Get exam countdowns, study reminders and messages on this device, even when the app is closed.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={turnOn}
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold font-cabin uppercase tracking-wider shadow-md shadow-indigo-500/20 transition-colors"
              >
                {busy ? "Turning on…" : "Turn on"}
              </button>
              {canInstall && (
                <button
                  onClick={install}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold font-cabin uppercase tracking-wider flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Install app
                </button>
              )}
              <button
                onClick={snooze}
                className="px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
