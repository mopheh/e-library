"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellOff, BellRing, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Preferences {
  pushMessages: boolean;
  pushConnections: boolean;
  pushAcademic: boolean;
  pushAccount: boolean;
  studyReminders: boolean;
  examReminders: boolean;
  reminderHour: number;
  quietHours: boolean;
}

const TOGGLES: { key: keyof Preferences; label: string; hint: string }[] = [
  { key: "examReminders", label: "Exam countdown", hint: "7, 3 and 1 day before each of your exams" },
  { key: "studyReminders", label: "Daily study reminder", hint: "A nudge on days you haven't studied yet" },
  { key: "pushMessages", label: "Messages", hint: "New chat messages and messages to your rep" },
  { key: "pushConnections", label: "Connections", hint: "Connection requests and matches" },
  { key: "pushAcademic", label: "Materials & requests", hint: "Uploads reviewed, material requests fulfilled" },
  { key: "pushAccount", label: "Account", hint: "Verification and role changes" },
];

// 07:00 - 21:00: anything earlier or later would fall inside quiet hours
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

function formatHour(h: number) {
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12}:00 ${suffix}`;
}

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const { status, busy, enable, disable } = usePushNotifications();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async (): Promise<Preferences> => {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) throw new Error("Failed to load preferences");
      return (await res.json()).preferences;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<Preferences>) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to save");
      return (await res.json()).preferences as Preferences;
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ["notification-preferences"] });
      const previous = queryClient.getQueryData<Preferences>(["notification-preferences"]);
      if (previous) queryClient.setQueryData(["notification-preferences"], { ...previous, ...patch });
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["notification-preferences"], ctx.previous);
      toast.error("Couldn't save that setting. Please try again.");
    },
    onSuccess: (data) => queryClient.setQueryData(["notification-preferences"], data),
  });

  const update = (patch: Partial<Preferences>) => mutation.mutate(patch);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose what reaches your phone. Everything still shows in your in-app notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* This device */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-start gap-3 min-w-0">
            <Smartphone className="w-5 h-5 mt-0.5 text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Push on this device</p>
              <p className="text-xs text-muted-foreground">
                {status === "on" && "On. You'll get notifications here even when the app is closed."}
                {status === "off" && "Off for this device."}
                {status === "denied" && "Blocked in your browser. Allow notifications for this site in browser settings, then come back."}
                {status === "needs-install" && "On iPhone, add RCF to your Home Screen (Share → Add to Home Screen), then open it from there."}
                {status === "unsupported" && "This browser doesn't support push notifications."}
                {status === "loading" && "Checking…"}
              </p>
            </div>
          </div>
          {status === "on" && (
            <Button variant="outline" size="sm" disabled={busy} onClick={disable}>
              <BellOff className="w-4 h-4 mr-1.5" /> Turn off
            </Button>
          )}
          {status === "off" && (
            <Button size="sm" disabled={busy} onClick={enable}>
              <BellRing className="w-4 h-4 mr-1.5" /> Turn on
            </Button>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {TOGGLES.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={`pref-${key}`} className="flex flex-col items-start gap-0.5 font-normal cursor-pointer">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </Label>
              <Switch
                id={`pref-${key}`}
                disabled={isLoading || !prefs}
                checked={Boolean(prefs?.[key])}
                onCheckedChange={(checked) => update({ [key]: checked })}
              />
            </div>
          ))}
        </div>

        {/* Timing */}
        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="flex flex-col items-start gap-0.5 font-normal">
              <span className="text-sm font-medium">Reminder time</span>
              <span className="text-xs text-muted-foreground">When study and exam reminders arrive</span>
            </Label>
            <Select
              disabled={isLoading || !prefs}
              value={prefs ? String(prefs.reminderHour) : undefined}
              onValueChange={(v) => update({ reminderHour: Number(v) })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="7:00 PM" />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {formatHour(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="pref-quietHours" className="flex flex-col items-start gap-0.5 font-normal cursor-pointer">
              <span className="text-sm font-medium">Quiet hours</span>
              <span className="text-xs text-muted-foreground">No push between 10 PM and 7 AM</span>
            </Label>
            <Switch
              id="pref-quietHours"
              disabled={isLoading || !prefs}
              checked={Boolean(prefs?.quietHours)}
              onCheckedChange={(checked) => update({ quietHours: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
