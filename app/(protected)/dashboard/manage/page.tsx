"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUserData } from "@/hooks/useUsers";
import ResourceRequestsTable from "@/components/adminDashboard/ResourceRequestsTable";
import PendingBooksTable from "@/components/adminDashboard/PendingBooksTable";
import AnnouncementTool from "@/components/adminDashboard/AnnouncementTool";
import AdminDashboard from "@/components/adminDashboard/AdminDashboard";
import CourseManagement from "@/components/adminDashboard/CourseManagement";
import AspirantManagement from "@/components/adminDashboard/AspirantManagement";
import AcademicScheduleManager from "@/components/adminDashboard/AcademicScheduleManager";
import CourseCbtQuestionManager from "@/components/adminDashboard/CourseCbtQuestionManager";
import {
    LayoutDashboard,
    Link as LinkIcon,
    ShieldCheck,
    Settings,
    Users,
    ChevronRight,
    Search,
    BookOpen,
    Database,
    GraduationCap,
    Calendar,
    Download,
    FileSpreadsheet,
    Loader2,
    Sparkles,
} from "lucide-react";
import Link from "next/link";

type TabId =
    | "overview"
    | "requests"
    | "uploads"
    | "announcements"
    | "courses"
    | "aspirants"
    | "schedule"
    | "data"
    | "coursecbt";

export default function FacultyManagementPage() {
    const { data: userData } = useUserData();
    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const [exporting, setExporting] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [now, setNow] = useState(new Date());

    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
        };
        if (showExportMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showExportMenu]);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    const handleExport = async (type: "students" | "activity") => {
        setExporting(type);
        setShowExportMenu(false);
        try {
            const res = await fetch(`/api/admin/export?type=${type}`);
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ||
                `${type}-report.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            alert("Failed to generate report. Please try again.");
        } finally {
            setExporting(null);
        }
    };

    if (!userData || (userData.role !== "ADMIN" && userData.role !== "FACULTY REP")) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] font-poppins text-center p-10">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 text-rose-500">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 font-cabin uppercase tracking-tighter">
                    Access Denied
                </h1>
                <p className="text-zinc-500 max-w-sm font-light font-poppins text-xs">
                    You do not have the necessary permissions to access the Faculty Management hub.
                </p>
            </div>
        );
    }

    const isAdmin = userData.role === "ADMIN";

    const greeting = (() => {
        const h = now.getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    })();

    const dateLabel = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
    const timeLabel = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const tabs = [
        { id: "overview" as TabId,      label: "Overview",      icon: LayoutDashboard },
        { id: "requests" as TabId,      label: "Resources",     icon: Search },
        { id: "uploads" as TabId,       label: "Uploads",       icon: BookOpen },
        { id: "announcements" as TabId, label: "Broadcast",     icon: LinkIcon },
        { id: "courses" as TabId,       label: "Courses",       icon: GraduationCap },
        { id: "schedule" as TabId,      label: "Schedule",      icon: Calendar },
        ...(isAdmin
            ? [
                  { id: "coursecbt" as TabId, label: "Course CBT",    icon: GraduationCap },
                  { id: "aspirants" as TabId, label: "Aspirants",     icon: Users },
                  { id: "data" as TabId,      label: "Platform Data", icon: Database },
              ]
            : []),
    ];

    return (
        <div className="space-y-5 font-poppins pb-20">

            {/* ADMIN HEADER CARD */}
            <div className="relative rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/60 shadow-sm">
                {/* 3-stop gradient accent bar */}
                <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-violet-500 to-cyan-400" />

                {/* Decorative layer — overflow-hidden only here so dropdown isn't clipped */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                    {/* Dot-grid texture */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                            opacity: 0.4,
                        }}
                    />
                    {/* Glow blob */}
                    <div
                        className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl"
                        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }}
                    />
                </div>

                <div className="relative z-10 px-7 md:px-10 pt-7 pb-8">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

                        {/* Left */}
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>

                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 mb-2">
                                    <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 font-cabin">
                                        {isAdmin ? "Super Admin" : "Faculty Rep"}
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-light mb-0.5">
                                    {greeting},{" "}
                                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                                        {userData.name?.split(" ")[0] ?? "Admin"}
                                    </span>
                                </p>

                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50 font-cabin uppercase tracking-tighter leading-tight">
                                    Control&nbsp;Center
                                </h1>

                                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-light max-w-sm leading-relaxed">
                                    {isAdmin
                                        ? "Platform-wide administration — faculties, resources & academic data."
                                        : `Scoped to Faculty of ${userData.facultyName || "Your Faculty"}.`}
                                </p>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-start md:items-end gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                <Calendar className="w-3 h-3 text-zinc-400" />
                                <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                    {dateLabel}&nbsp;·&nbsp;{timeLabel}
                                </span>
                            </div>

                            {isAdmin && (
                                <div className="relative" ref={exportRef}>
                                    <button
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        disabled={!!exporting}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest font-cabin transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-zinc-900/10 whitespace-nowrap"
                                    >
                                        {exporting ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Download className="w-3.5 h-3.5" />
                                        )}
                                        {exporting ? "Generating…" : "Export Report"}
                                    </button>

                                    {showExportMenu && (
                                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden z-50 min-w-[220px]">
                                            <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 font-cabin">
                                                Choose report
                                            </p>
                                            <button
                                                onClick={() => handleExport("students")}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 shrink-0">
                                                    <Users className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-xs text-zinc-700 dark:text-zinc-200">Student Directory</p>
                                                    <p className="text-[10px] text-zinc-400">Names, emails, departments</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleExport("activity")}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 shrink-0">
                                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-xs text-zinc-700 dark:text-zinc-200">Activity Report</p>
                                                    <p className="text-[10px] text-zinc-400">Reading, CBT scores, usage</p>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* NAV TABS */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 font-bold text-[10px] uppercase tracking-widest font-cabin ${
                            activeTab === tab.id
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/10"
                                : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-200 dark:hover:border-zinc-700"
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5 shrink-0" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">
                {activeTab === "overview" && (
                    <>
                        <div className="lg:col-span-4 space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <Link
                                    href="/dashboard/admin/verifications"
                                    className="group p-8 bg-white dark:bg-zinc-950 border-none shadow-sm rounded-[2.5rem] hover:ring-2 ring-blue-500/20 transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:rotate-6 transition-transform">
                                            <ShieldCheck className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-2 font-cabin uppercase tracking-tighter flex items-center gap-2">
                                            Verification <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                                        </h3>
                                        <p className="text-xs text-zinc-500 font-poppins font-light leading-relaxed">Review admission proofs to upgrade aspirants to official student accounts.</p>
                                    </div>
                                    <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 group-hover:scale-125 transition-transform">
                                        <Users className="w-32 h-32" />
                                    </div>
                                </Link>

                                <button
                                    onClick={() => setActiveTab("uploads")}
                                    className="text-left group p-8 bg-white dark:bg-zinc-950 border-none shadow-sm rounded-[2.5rem] hover:ring-2 ring-blue-500/20 transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:rotate-6 transition-transform">
                                            <BookOpen className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-2 font-cabin uppercase tracking-tighter flex items-center gap-2">
                                            Library Mgmt <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                                        </h3>
                                        <p className="text-xs text-zinc-500 font-poppins font-light leading-relaxed">Review pending material uploads before they go live.</p>
                                    </div>
                                    <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 group-hover:scale-125 transition-transform">
                                        <Database className="w-32 h-32" />
                                    </div>
                                </button>
                            </div>
                            <ResourceRequestsTable />
                        </div>

                        <div className="lg:col-span-3 space-y-10">
                            <AnnouncementTool />
                            <div className="p-10 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-[3rem] text-white shadow-2xl shadow-zinc-900/20 relative overflow-hidden">
                                <Settings className="w-10 h-10 text-blue-500 mb-8" />
                                <h3 className="text-2xl font-bold mb-6 font-cabin uppercase tracking-tighter">Permissions</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 shrink-0" />
                                        <p className="text-[11px] text-zinc-400 leading-relaxed font-poppins font-light">
                                            <span className="font-bold text-zinc-300 uppercase block mb-1">Scope</span>
                                            {isAdmin ? "Global administrative rights: total control over all platform entities." : `Restricted to Faculty of ${userData.facultyName}.`}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 shrink-0" />
                                        <p className="text-[11px] text-zinc-400 leading-relaxed font-poppins font-light">
                                            <span className="font-bold text-zinc-300 uppercase block mb-1">Verifications</span>
                                            Authorize admission proofs to grant full student access.
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 shrink-0" />
                                        <p className="text-[11px] text-zinc-400 leading-relaxed font-poppins font-light">
                                            <span className="font-bold text-zinc-300 uppercase block mb-1">Curation</span>
                                            Fulfill resource requests to maintain high-quality academic data.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "requests" && (
                    <div className="lg:col-span-7"><ResourceRequestsTable /></div>
                )}
                {activeTab === "uploads" && (
                    <div className="lg:col-span-7"><PendingBooksTable /></div>
                )}
                {activeTab === "courses" && (
                    <div className="lg:col-span-7"><CourseManagement /></div>
                )}
                {activeTab === "aspirants" && isAdmin && (
                    <div className="lg:col-span-7"><AspirantManagement /></div>
                )}
                {activeTab === "schedule" && (
                    <div className="lg:col-span-7"><AcademicScheduleManager /></div>
                )}
                {activeTab === "announcements" && (
                    <div className="lg:col-span-7 max-w-3xl mx-auto w-full"><AnnouncementTool /></div>
                )}
                {activeTab === "data" && isAdmin && (
                    <div className="lg:col-span-7"><AdminDashboard /></div>
                )}
                {activeTab === "coursecbt" && isAdmin && (
                    <div className="lg:col-span-7"><CourseCbtQuestionManager /></div>
                )}
            </div>
        </div>
    );
}
