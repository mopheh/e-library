"use client";

import React, { useState } from "react";
import { useUserData } from "@/hooks/useUsers";
import ResourceRequestsTable from "@/components/adminDashboard/ResourceRequestsTable";
import AnnouncementTool from "@/components/adminDashboard/AnnouncementTool";
import AdminDashboard from "@/components/adminDashboard/AdminDashboard";
import { 
    LayoutDashboard, 
    Link as LinkIcon, 
    ShieldCheck, 
    Settings,
    Users,
    ChevronRight,
    Search,
    BookOpen,
    Database
} from "lucide-react";
import Link from "next/link";

export default function FacultyManagementPage() {
    const { data: userData } = useUserData();
    const [activeTab, setActiveTab] = useState<"overview" | "requests" | "announcements" | "data">("overview");

    if (!userData || (userData.role !== "ADMIN" && userData.role !== "FACULTY REP")) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] font-poppins text-center p-10">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 text-rose-500">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 font-cabin uppercase tracking-tighter">Access Denied</h1>
                <p className="text-zinc-500 max-w-sm font-light font-poppins text-xs">You do not have the necessary permissions to access the Faculty Management hub.</p>
            </div>
        );
    }

    const isAdmin = userData.role === "ADMIN";

    return (
        <div className="space-y-12 font-poppins pb-20 italic-none">
            {/* Header section with Stats or Welcome */}
            <div className="bg-zinc-900 dark:bg-zinc-50 rounded-[3rem] p-10 md:p-14 text-white dark:text-zinc-900 shadow-2xl shadow-zinc-900/20 relative overflow-hidden group">
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 font-cabin uppercase tracking-tighter">Management</h1>
                    <p className="text-zinc-400 dark:text-zinc-500 max-w-xl font-normal text-sm leading-relaxed">
                        {isAdmin 
                            ? "Platform-wide control center for managing faculties, departments, and academic resources." 
                            : `Central management for the Faculty of ${userData.facultyName || 'Your Assigned Faculty'}.`}
                    </p>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-64 h-64" />
                </div>
            </div>

            {/* Main Tabs/Navigation */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {[
                    { id: "overview", label: "Overview", icon: LayoutDashboard },
                    { id: "requests", label: "Resources", icon: Search },
                    { id: "announcements", label: "Broadcast", icon: LinkIcon },
                    ...(isAdmin ? [{ id: "data", label: "Platform Data", icon: Database }] : [])
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl whitespace-nowrap transition-all duration-300 font-bold text-xs uppercase tracking-widest font-cabin ${
                            activeTab === tab.id 
                            ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105" 
                            : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-10">
                {activeTab === "overview" && (
                    <>
                        <div className="lg:col-span-4 space-y-10">
                            {/* Quick Stats or Introduction */}
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

                                <div className="p-8 bg-white dark:bg-zinc-950 border-none shadow-sm rounded-[2.5rem] relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                            <BookOpen className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 font-cabin uppercase tracking-tighter">Library Mgmt</h3>
                                        <p className="text-xs text-zinc-500 font-poppins font-light leading-relaxed">Maintain the platform library by updating or removing resources.</p>
                                    </div>
                                    <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-5 group-hover:scale-125 transition-transform">
                                        <Database className="w-32 h-32" />
                                    </div>
                                </div>
                            </div>

                            <ResourceRequestsTable />
                        </div>
                        <div className="lg:col-span-3 space-y-10">
                            <AnnouncementTool />
                            
                            {/* Role Information Card */}
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
                    <div className="lg:col-span-7">
                        <ResourceRequestsTable />
                    </div>
                )}

                {activeTab === "announcements" && (
                    <div className="lg:col-span-7 max-w-3xl mx-auto w-full">
                        <AnnouncementTool />
                    </div>
                )}

                {activeTab === "data" && isAdmin && (
                    <div className="lg:col-span-7">
                        <AdminDashboard />
                    </div>
                )}
            </div>
        </div>
    );
}
