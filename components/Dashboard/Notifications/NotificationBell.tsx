"use client";
import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

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
            // Append incoming notification to the front of the list
            setNotifications((prev) => [newNotif, ...prev]);
            // Optional: Play a sound or show a toast dynamically
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
            // Update local state proactively
            setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => {
            if (open) markAsRead();
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                    <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-950"></span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
                <div className="p-3 font-semibold text-sm border-b dark:border-zinc-800">
                    Notifications
                </div>
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                        No recent notifications.
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((notif) => (
                            <div key={notif.id} className={`p-3 text-sm border-b dark:border-zinc-800 last:border-0 ${notif.isRead ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium font-poppins text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                        {notif.type}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="mt-2 text-zinc-700 dark:text-zinc-200 text-xs">
                                    {notif.message}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
