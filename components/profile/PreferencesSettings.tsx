"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationSettings from "./NotificationSettings";
import { card, SectionTitle } from "./ProfileOverview";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the theme after hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-5">
      <section className={cn(card, "p-5 sm:p-6")}>
        <SectionTitle>Appearance</SectionTitle>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2 max-w-md">
          {THEMES.map(({ value, label, icon: Icon }) => {
            const active = mounted && theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border py-4 text-xs font-semibold transition-colors",
                  active
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-200"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <NotificationSettings />
    </div>
  );
}
