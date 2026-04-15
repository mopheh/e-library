"use client";
import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { Bell, UserPlus, Zap, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications);
                    setUserId(data.userId);
                }
            } catch (err) {
                console.error("Failed to load notifications", err);
            }
        };
        fetchNotifs();
    }, []);

    // Pusher setup
    useEffect(() => {
        if (!userId) return;

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const channel = pusher.subscribe(`user-${userId}`);
        
        channel.bind("new-notification", (newNotif: any) => {
            setNotifications((prev) => [newNotif, ...prev]);
        });

        return () => {
            pusher.unsubscribe(`user-${userId}`);
        };
    }, [userId]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length === 0) return;

        try {
            await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: unreadIds })
            });
            setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CONNECTION_REQUEST': return <UserPlus className="w-3 h-3 text-blue-600" />;
            case 'SYSTEM': return <ShieldCheck className="w-3 h-3 text-amber-600" />;
            case 'GENERAL': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
            default: return <Bell className="w-3 h-3 text-zinc-400" />;
        }
    }

    return (
        <DropdownMenu onOpenChange={(open) => {
            if (open) markAsRead();
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                    <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse"></span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-80 max-h-[32rem] overflow-hidden p-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <div className="p-4 font-bold text-sm border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    Notifications
                    {unreadCount > 0 && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                </div>
                
                <div className="overflow-y-auto max-h-96">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500 font-poppins">
                            <Bell className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                            No recent updates.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.slice(0, 5).map((notif) => (
                                <div key={notif.id} className={`p-4 text-sm border-b dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${notif.isRead ? 'opacity-60' : ''}`}>
                                    <div className="flex gap-3">
                                        <div className="mt-1 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 h-fit">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 font-medium">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Link href="/dashboard/notifications">
                    <div className="p-3 text-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-zinc-50 dark:bg-zinc-900/50 border-t dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 group cursor-pointer">
                        View All Notifications <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
