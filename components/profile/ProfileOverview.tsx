"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Camera,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Flame,
  GraduationCap,
  Layers,
  PencilLine,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile, ProfileUpdate } from "@/hooks/useProfile";
import { CLASS_TONE } from "@/components/grades/CgpaSummary";
import { formatMinutes } from "@/components/study-log/LogStudySheet";
import FacultyRepSection from "./FacultyRepSection";
import ActivityHistory from "./ActivityHistory";

export const card = "rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 shadow-sm";

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 font-cabin">{children}</h2>
      {action}
    </div>
  );
}

export const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  ADMIN: "Admin",
  "FACULTY REP": "Faculty rep",
  ASPIRANT: "Aspirant",
};

const GENDER_LABEL: Record<string, string> = { MALE: "Male", FEMALE: "Female" };

export type GoTo = (tab: "overview" | "edit" | "activity" | "preferences" | "account", field?: keyof ProfileUpdate) => void;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function formatDob(dob: string) {
  const d = new Date(`${dob}T00:00:00`);
  return Number.isNaN(d.getTime()) ? dob : format(d, "d MMMM yyyy");
}

function formatPhone(p: string) {
  // 08031234567 -> 0803 123 4567
  return /^0\d{10}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;
}

// ── Identity ─────────────────────────────────────────────────────────────

function CopyMatric({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      aria-label={`Copy matric number ${value}`}
    >
      {value}
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-400" />}
    </button>
  );
}

function IdentityCard({ profile, goTo }: { profile: Profile; goTo: GoTo }) {
  const { academic } = profile;
  return (
    <div className={cn(card, "overflow-hidden")}>
      <div className="h-20 sm:h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500" />
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-3xl overflow-hidden ring-4 ring-white dark:ring-zinc-900 bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" fill sizes="96px" className="object-cover" />
            ) : (
              <span className="text-2xl font-black font-cabin text-indigo-600 dark:text-indigo-300">{initials(profile.fullName)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 break-words">
                {profile.fullName}
              </h2>
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5 break-all">{profile.email}</p>
          </div>
          <div className="flex gap-2 sm:pb-1">
            <button
              type="button"
              onClick={() => goTo("edit")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              <PencilLine className="w-3.5 h-3.5" /> Edit details
            </button>
            <button
              type="button"
              onClick={() => goTo("account")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" /> Photo
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <CopyMatric value={academic.matricNo} />
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-zinc-400" />
            {academic.level} Level
          </span>
          <span className="min-w-0">
            {[academic.departmentName, academic.facultyName].filter(Boolean).join(" · ")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Academic snapshot ───────────────────────────────────────────────────

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  href,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  href: string;
  tone: string;
}) {
  return (
    <Link href={href} className={cn(card, "group p-4 sm:p-5 flex flex-col gap-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors")}>
      <div className="flex items-center justify-between">
        <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center", tone)}>
          <Icon className="w-4 h-4" />
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div>
        <p className="text-2xl font-black font-cabin tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">{value}</p>
        <p className="text-xs font-medium text-zinc-500 mt-0.5">{label}</p>
      </div>
      {sub && <div className="text-[11px] text-zinc-500 -mt-1">{sub}</div>}
    </Link>
  );
}

function Snapshot({ stats }: { stats: Profile["stats"] }) {
  const tone = stats.degreeClass ? CLASS_TONE[stats.degreeClass.key] : null;
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <Tile
        icon={GraduationCap}
        tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
        label="CGPA"
        href="/dashboard/grades"
        value={stats.cgpa != null ? stats.cgpa.toFixed(2) : "—"}
        sub={
          stats.degreeClass && tone ? (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold", tone.pill)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", tone.dot)} />
              {stats.degreeClass.label}
            </span>
          ) : (
            "Add your results"
          )
        }
      />
      <Tile
        icon={Flame}
        tone="bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300"
        label="Day streak"
        href="/dashboard/progress"
        value={stats.streak}
        sub={stats.streak ? "Keep it going today" : "Study today to start one"}
      />
      <Tile
        icon={Timer}
        tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
        label="Studied, last 7 days"
        href="/dashboard/progress"
        value={formatMinutes(stats.weekMinutes)}
        sub={`${formatMinutes(stats.totalMinutes)} all time`}
      />
      <Tile
        icon={ClipboardCheck}
        tone="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        label="CBT average"
        href="/cbt"
        value={stats.cbtAvg != null ? `${stats.cbtAvg}%` : "—"}
        sub={stats.cbtAttempts ? `Last ${stats.cbtAttempts} test${stats.cbtAttempts === 1 ? "" : "s"}` : "Take a practice test"}
      />
    </div>
  );
}

// ── Details ─────────────────────────────────────────────────────────────

const isPlaceholder = (v: string) => /^(?:|n\/?a|nil|none|null|-+|\.+)$/i.test(v.trim());

const REQUIRED_FOR_COMPLETE: { field: keyof ProfileUpdate; label: string; has: (p: Profile) => boolean }[] = [
  { field: "phoneNumber", label: "Phone number", has: (p) => !!p.personal.phoneNumber },
  { field: "dateOfBirth", label: "Date of birth", has: (p) => !!p.personal.dateOfBirth },
  { field: "address", label: "Address", has: (p) => !isPlaceholder(p.personal.address) },
];

function Completeness({ profile, goTo }: { profile: Profile; goTo: GoTo }) {
  // Name, email, matric, gender, faculty, department and level are required
  // at sign-up, so they always count as done.
  const base = 7;
  const missing = REQUIRED_FOR_COMPLETE.filter((r) => !r.has(profile));
  if (missing.length === 0) return null;
  const total = base + REQUIRED_FOR_COMPLETE.length;
  const pct = Math.round(((total - missing.length) / total) * 100);

  return (
    <div className={cn(card, "p-5")}>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Complete your profile</p>
        <p className="text-sm font-black font-cabin text-indigo-600 dark:text-indigo-400 tabular-nums">{pct}%</p>
      </div>
      <div className="mt-2.5 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {missing.map((m) => (
          <button
            key={m.field}
            type="button"
            onClick={() => goTo("edit", m.field)}
            className="rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          >
            + {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, onAdd }: { label: string; value: React.ReactNode; onAdd?: () => void }) {
  return (
    <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr] gap-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/70 last:border-0">
      <dt className="text-xs text-zinc-500 pt-0.5">{label}</dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-100 min-w-0 break-words">
        {value || (
          <button type="button" onClick={onAdd} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Add
          </button>
        )}
      </dd>
    </div>
  );
}

function DetailsCard({ profile, goTo }: { profile: Profile; goTo: GoTo }) {
  const { personal, academic } = profile;
  return (
    <div className={cn(card, "p-5")}>
      <SectionTitle
        action={
          <button type="button" onClick={() => goTo("edit")} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Edit
          </button>
        }
      >
        Your details
      </SectionTitle>
      <dl>
        <Row label="Full name" value={profile.fullName} />
        <Row label="Email" value={profile.email} />
        <Row label="Phone" value={personal.phoneNumber && formatPhone(personal.phoneNumber)} onAdd={() => goTo("edit", "phoneNumber")} />
        <Row label="Gender" value={GENDER_LABEL[personal.gender] ?? personal.gender} />
        <Row label="Date of birth" value={personal.dateOfBirth && formatDob(personal.dateOfBirth)} onAdd={() => goTo("edit", "dateOfBirth")} />
        <Row label="Address" value={!isPlaceholder(personal.address) && personal.address} onAdd={() => goTo("edit", "address")} />
      </dl>
      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />
      <dl>
        <Row label="Matric no." value={<span className="font-mono">{academic.matricNo}</span>} />
        <Row label="Faculty" value={academic.facultyName} />
        <Row label="Department" value={academic.departmentName} />
        <Row label="Level" value={`${academic.level} Level`} />
        {profile.memberSince && <Row label="Member since" value={format(new Date(profile.memberSince), "MMMM yyyy")} />}
      </dl>
    </div>
  );
}

function LibraryUsage({ stats }: { stats: Profile["stats"] }) {
  const rows = [
    { icon: BookOpen, label: "Books read", value: stats.booksRead },
    { icon: Layers, label: "Pages read", value: stats.pagesRead },
    { icon: Download, label: "Downloads", value: stats.downloads },
    { icon: BrainCircuit, label: "AI questions asked", value: stats.aiRequests },
  ];
  return (
    <div className={cn(card, "p-5")}>
      <SectionTitle>Library</SectionTitle>
      <ul className="grid grid-cols-2 gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <Icon className="w-4 h-4 text-zinc-400" />
            <p className="mt-2 text-lg font-black font-cabin text-zinc-900 dark:text-zinc-50 tabular-nums">{value.toLocaleString()}</p>
            <p className="text-[11px] text-zinc-500">{label}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProfileOverview({ profile, goTo }: { profile: Profile; goTo: GoTo }) {
  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
      <div className="space-y-4 sm:space-y-5 min-w-0">
        <IdentityCard profile={profile} goTo={goTo} />
        <Snapshot stats={profile.stats} />
        <div className="lg:hidden">
          <Completeness profile={profile} goTo={goTo} />
        </div>
        <div className={cn(card, "p-5")}>
          <SectionTitle
            action={
              profile.timeline.length > 5 && (
                <button type="button" onClick={() => goTo("activity")} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  View all
                </button>
              )
            }
          >
            Recent activity
          </SectionTitle>
          <ActivityHistory items={profile.timeline} limit={5} />
        </div>
        {profile.role !== "FACULTY REP" && <FacultyRepSection />}
      </div>

      <aside className="space-y-4 sm:space-y-5 min-w-0">
        <div className="hidden lg:block">
          <Completeness profile={profile} goTo={goTo} />
        </div>
        <DetailsCard profile={profile} goTo={goTo} />
        <LibraryUsage stats={profile.stats} />
      </aside>
    </div>
  );
}
