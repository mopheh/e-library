"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, BadgeCheck, CloudUpload, Globe2, Sparkles, X } from "lucide-react";
import { useUserData } from "@/hooks/useUsers";
import { TYPE_STYLES } from "@/lib/bookTypes";
import { TOUR_KEY } from "./OnboardingTour";

const seenKey = (userId: string) => `contribute_welcome_${userId}`;

const SHOW_AFTER_MS = 2500;
const RECHECK_MS = 1500;

const SHAREABLE_TYPES = ["past question", "note", "textbook", "material"] as const;

const STEPS = [
  {
    icon: CloudUpload,
    title: "Upload a file",
    body: "PDF, DOC, DOCX or EPUB, up to 50MB. Tag it to your courses.",
  },
  {
    icon: BadgeCheck,
    title: "We review it",
    body: "An admin checks it before it goes live, so the library stays trustworthy.",
  },
  {
    icon: Globe2,
    title: "Your classmates find it",
    body: "It shows up in the library and course workspaces for your department.",
  },
];

function readFlag(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Private mode / blocked storage: worst case the popup shows again.
  }
}

// The dashboard can open the onboarding tour and CourseRegistrationModal on a
// first login. Stacking a third modal on those is hostile, so we hold off until
// the tour is done and no other dialog is open.
function screenIsFree() {
  if (readFlag(TOUR_KEY) !== "1") return false;
  return !document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
  );
}

/**
 * One-time welcome popup pointing students at the contribute-material flow,
 * shown once per user on their first dashboard visit.
 */
export function ContributeWelcomeNudge() {
  const router = useRouter();
  const { user } = useUser();
  const { data: userData } = useUserData();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id || !userData) return;
    if (userData.role === "ASPIRANT") return;
    if (readFlag(seenKey(user.id))) return;

    let timer: ReturnType<typeof setTimeout>;
    const tryShow = () => {
      if (screenIsFree()) {
        writeFlag(seenKey(user.id));
        setOpen(true);
      } else {
        timer = setTimeout(tryShow, RECHECK_MS);
      }
    };
    timer = setTimeout(tryShow, SHOW_AFTER_MS);

    return () => clearTimeout(timer);
  }, [user?.id, userData]);

  const contribute = () => {
    setOpen(false);
    router.push("/library?contribute=1");
  };

  const firstName = user?.firstName?.trim();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-zinc-950/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed z-[110] inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white dark:bg-zinc-900 shadow-2xl outline-none font-poppins
            data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom duration-300
            sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(520px,calc(100vw-2rem))] sm:rounded-3xl
            sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:fade-out-0 sm:duration-200"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 px-6 pt-7 pb-8 text-white sm:rounded-t-3xl">
            <div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="absolute -left-10 -bottom-24 h-48 w-48 rounded-full bg-indigo-400/30 blur-2xl" />

            {/* Grab handle on the mobile sheet */}
            <div aria-hidden className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/40 sm:hidden" />

            <DialogPrimitive.Close
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Welcome to the library
              </span>
              <DialogPrimitive.Title className="mt-4 text-2xl font-bold leading-tight font-cabin sm:text-[26px]">
                {firstName ? `${firstName}, help` : "Help"} build your department&apos;s library
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 max-w-[40ch] text-sm leading-relaxed text-blue-50/90">
                Everything here was shared by students like you. One upload can save a whole class a
                late-night search before exams.
              </DialogPrimitive.Description>

              {/* Floating type chips */}
              <div className="mt-5 flex flex-wrap gap-2">
                {SHAREABLE_TYPES.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm"
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${TYPE_STYLES[t].color}`}>
                      {TYPE_STYLES[t].icon}
                    </span>
                    {TYPE_STYLES[t].label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="px-6 pt-6">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-cabin">
              How it works
            </p>
            <ol className="mt-3 space-y-0">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="absolute left-[17px] top-10 bottom-1 w-px bg-zinc-200 dark:bg-zinc-800" />
                  )}
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/40">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <DialogPrimitive.Close className="rounded-xl px-4 py-3 text-sm font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 sm:py-2.5">
              Maybe later
            </DialogPrimitive.Close>
            <button
              type="button"
              onClick={contribute}
              autoFocus
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 sm:py-2.5"
            >
              Contribute material
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
