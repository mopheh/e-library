"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, IdCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  getSystemSettings,
  setGlobalAiEnabled,
  setMatricFacultyCheckEnabled,
} from "@/app/(protected)/dashboard/admin/settings/actions";

const SystemSettings = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [matricCheckEnabled, setMatricCheckEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matricSaving, setMatricSaving] = useState(false);

  useEffect(() => {
    getSystemSettings()
      .then((s) => {
        setAiEnabled(s.aiEnabled);
        setMatricCheckEnabled(s.matricFacultyCheckEnabled);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (checked: boolean) => {
    const previous = aiEnabled;
    setAiEnabled(checked);
    setSaving(true);
    try {
      await setGlobalAiEnabled(checked);
      toast.success(checked ? "AI features enabled platform-wide" : "AI features disabled platform-wide");
    } catch (err: any) {
      setAiEnabled(previous);
      toast.error(err.message || "Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  const handleMatricToggle = async (checked: boolean) => {
    const previous = matricCheckEnabled;
    setMatricCheckEnabled(checked);
    setMatricSaving(true);
    try {
      await setMatricFacultyCheckEnabled(checked);
      toast.success(checked ? "Matric faculty-prefix check enabled" : "Matric faculty-prefix check disabled");
    } catch (err: any) {
      setMatricCheckEnabled(previous);
      toast.error(err.message || "Failed to update setting");
    } finally {
      setMatricSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
              AI Features
            </h3>
            <p className="text-[10px] text-zinc-400 font-poppins">
              Platform-wide switch for the AI study assistant
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins">
              Enable AI for all users
            </p>
            <p className="text-[11px] text-zinc-400 font-poppins mt-0.5">
              {aiEnabled
                ? "AI chat is available to everyone (individual users can still be disabled separately)."
                : "AI chat is turned off platform-wide, regardless of per-user settings."}
            </p>
          </div>
          <Switch
            checked={aiEnabled}
            disabled={loading || saving}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <IdCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
              Matric Number Validation
            </h3>
            <p className="text-[10px] text-zinc-400 font-poppins">
              Faculty-prefix check for student matric numbers
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins">
              Enforce faculty-code prefix
            </p>
            <p className="text-[11px] text-zinc-400 font-poppins mt-0.5">
              {matricCheckEnabled
                ? "Matric numbers must start with a code matching the student's faculty (e.g. ENG for Engineering)."
                : "Only the format (3 letters + 7 digits) is checked — the faculty-code map hasn't been validated against enough signups yet."}
            </p>
          </div>
          <Switch
            checked={matricCheckEnabled}
            disabled={loading || matricSaving}
            onCheckedChange={handleMatricToggle}
          />
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
