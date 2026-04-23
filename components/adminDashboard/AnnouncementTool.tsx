"use client";

import React, { useState } from "react";
import { broadcastAnnouncement } from "@/actions/resources";
import { 
    Megaphone, 
    Send, 
    Loader2, 
    Globe, 
    Building2,
    Info
} from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUsers";

export default function AnnouncementTool() {
    const { data: userData } = useUserData();
    const [content, setContent] = useState("");
    const [targetType, setTargetType] = useState<"DEPARTMENT" | "FACULTY">("DEPARTMENT");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!userData || (userData.role !== "ADMIN" && userData.role !== "FACULTY REP")) return null;

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return toast.error("Please enter announcement content");

        setIsSubmitting(true);
        const res = await broadcastAnnouncement(content, targetType);
        if (res.success) {
            toast.success(res.message || "Announcement broadcasted!");
            setContent("");
        } else {
            toast.error(res.error || "Failed to broadcast announcement");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-[3rem] border-none p-10 font-poppins shadow-sm relative overflow-hidden group/box">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover/box:rotate-12 transition-transform">
                    <Megaphone className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-cabin uppercase tracking-tighter">Broadcast</h3>
                    <p className="text-[10px] text-zinc-500 font-normal opacity-70 font-poppins">Push updates to community feeds.</p>
                </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-8">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-3 block">Target Feed</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setTargetType("DEPARTMENT")}
                            className={`flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all duration-300 ${
                                targetType === "DEPARTMENT" 
                                ? "bg-white dark:bg-zinc-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/5" 
                                : "bg-zinc-50 dark:bg-zinc-900/50 border-transparent text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            }`}
                        >
                            <Building2 className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest font-cabin">Local</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTargetType("FACULTY")}
                            className={`flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all duration-300 ${
                                targetType === "FACULTY" 
                                ? "bg-white dark:bg-zinc-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/5" 
                                : "bg-zinc-50 dark:bg-zinc-900/50 border-transparent text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            }`}
                        >
                            <Globe className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest font-cabin">Global</span>
                        </button>
                    </div>
                    {targetType === "FACULTY" && (
                        <div className="mt-4 flex gap-3 p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl items-start border border-blue-100/20">
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium leading-relaxed">
                                Post will propagate to all departments within your faculty. Use for high-priority news.
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-3 block">Update Content</label>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type announcement..."
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-3xl p-6 text-sm ring-blue-500/10 focus:ring-4 transition-all outline-none resize-none h-44 font-poppins font-light leading-relaxed"
                    />
                </div>

                <button 
                    disabled={isSubmitting}
                    className="w-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-xs uppercase font-poppins shadow-2xl shadow-zinc-900/20"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            <Send className="w-4 h-4" /> Finalize Broadcast
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
