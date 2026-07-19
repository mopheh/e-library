"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, IdCard, Gauge } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  getSystemSettings,
  setGlobalAiEnabled,
  setMatricFacultyCheckEnabled,
  setAiRequestLimitEnabled,
  setAiRequestLimit,
} from "@/app/(protected)/dashboard/admin/settings/actions";

const SystemSettings = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [matricCheckEnabled, setMatricCheckEnabled] = useState(false);
  const [limitEnabled, setLimitEnabled] = useState(true);
  const [requestLimit, setRequestLimit] = useState(10);
  const [limitInput, setLimitInput] = useState("10");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matricSaving, setMatricSaving] = useState(false);
  const [limitToggleSaving, setLimitToggleSaving] = useState(false);
  const [limitValueSaving, setLimitValueSaving] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSystemSettings()
      .then((s) => {
        setAiEnabled(s.aiEnabled);
        setMatricCheckEnabled(s.matricFacultyCheckEnabled);
        setLimitEnabled(s.aiRequestLimitEnabled);
        setRequestLimit(s.aiRequestLimit);
        setLimitInput(String(s.aiRequestLimit));
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

  const handleLimitToggle = async (checked: boolean) => {
    const previous = limitEnabled;
    setLimitEnabled(checked);
    setLimitToggleSaving(true);
    try {
      await setAiRequestLimitEnabled(checked);
      toast.success(checked ? "Daily AI request limit enabled" : "Daily AI request limit disabled");
    } catch (err: any) {
      setLimitEnabled(previous);
      toast.error(err.message || "Failed to update setting");
    } finally {
      setLimitToggleSaving(false);
    }
  };

  const handleLimitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLimitInput(val);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000) {
      saveTimerRef.current = setTimeout(async () => {
        setLimitValueSaving(true);
        const previous = requestLimit;
        setRequestLimit(parsed);
        try {
          await setAiRequestLimit(parsed);
          toast.success(`Daily limit updated to ${parsed} request${parsed === 1 ? "" : "s"}`);
        } catch (err: any) {
          setRequestLimit(previous);
          setLimitInput(String(previous));
          toast.error(err.message || "Failed to update limit");
        } finally {
          setLimitValueSaving(false);
        }
      }, 800);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* AI Features global toggle */}
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

      {/* Per-user daily request limit */}
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-sm overflow-hidden p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black font-cabin uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
              AI Request Limit
            </h3>
            <p className="text-[10px] text-zinc-400 font-poppins">
              Daily per-user AI request cap
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900">
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins">
                Enforce daily limit
              </p>
              <p className="text-[11px] text-zinc-400 font-poppins mt-0.5">
                {limitEnabled
                  ? `Each user can make up to ${requestLimit} AI request${requestLimit === 1 ? "" : "s"} per day.`
                  : "No cap enforced — users can make unlimited AI requests."}
              </p>
            </div>
            <Switch
              checked={limitEnabled}
              disabled={loading || limitToggleSaving}
              onCheckedChange={handleLimitToggle}
            />
          </div>

          {/* Limit value editor */}
          <div
            className={`flex items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 transition-opacity ${
              !limitEnabled ? "opacity-40 pointer-events-none select-none" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-poppins">
                Requests per day
              </p>
              <p className="text-[11px] text-zinc-400 font-poppins mt-0.5">
                Between 1 and 1000. Changes save automatically.
              </p>
            </div>
            <div className="relative flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={1000}
                value={limitInput}
                onChange={handleLimitInputChange}
                disabled={loading || limitValueSaving || !limitEnabled}
                className="w-20 text-center text-sm font-bold font-poppins rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-50"
              />
              {limitValueSaving && (
                <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-500 rounded-full animate-spin" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matric Number Validation */}
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
