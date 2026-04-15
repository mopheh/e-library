"use client";
import React from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileMessagingButton() {
    const pathname = usePathname();
    
    // Hide if already on messages page
    if (pathname === "/dashboard/messages") return null;

    return (
        <Link
            href="/dashboard/messages"
            className="fixed bottom-24 right-6 z-50 p-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all active:scale-90 md:hidden flex items-center justify-center border border-white/20 backdrop-blur-sm shadow-blue-500/20"
            aria-label="Open Messages"
        >
            <div className="relative">
                 <MessageCircle className="w-6 h-6" />
                 <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-blue-600"></span>
                 </span>
            </div>
        </Link>
    );
}
