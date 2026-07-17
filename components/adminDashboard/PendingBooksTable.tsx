"use client";

import React, { useState, useEffect } from "react";
import { getPendingBooks, approveBook, rejectBook } from "@/actions/bookReview";
import {
    CheckCircle,
    XCircle,
    MoreHorizontal,
    Loader2,
    ExternalLink,
    Inbox,
    Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import FormModal from "@/components/FormDialogBody";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function PendingBooksTable() {
    const [pending, setPending] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const load = async () => {
        setIsLoading(true);
        const res = await getPendingBooks();
        if (res.success) {
            setPending(res.data || []);
        } else {
            toast.error(res.error || "Failed to load pending uploads");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleApprove = async (bookId: string) => {
        setApprovingId(bookId);
        const res = await approveBook(bookId);
        if (res.success) {
            toast.success("Upload approved — it's now live");
            load();
        } else {
            toast.error(res.error || "Failed to approve upload");
        }
        setApprovingId(null);
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await rejectBook(selectedBook.id, rejectReason);
        if (res.success) {
            toast.success("Upload rejected");
            setRejectModalOpen(false);
            setRejectReason("");
            load();
        } else {
            toast.error(res.error || "Failed to reject upload");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden font-poppins">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        Pending Uploads <Inbox className="w-5 h-5 text-blue-600" />
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Review Faculty Rep material submissions before they go live.</p>
                </div>
                <button
                   onClick={load}
                   className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <Filter className="w-4 h-4 text-zinc-400" />
                </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] uppercase tracking-widest font-bold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                            <th className="px-6 py-4">Uploaded By</th>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Submitted</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="text-xs text-zinc-400">Loading pending uploads...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : pending.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-sm">
                                    No pending uploads — you&apos;re all caught up.
                                </td>
                            </tr>
                        ) : (
                            pending.map((book) => (
                                <tr key={book.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-zinc-100 dark:border-zinc-800">
                                                <AvatarImage src={book.postedByUser?.imageUrl || undefined} alt={book.postedByUser?.fullName} />
                                                <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                                    {book.postedByUser?.fullName?.split(" ").map((n: any) => n[0]).join("") || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{book.postedByUser?.fullName}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 max-w-[240px] font-semibold">
                                            {book.title}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            {book.department?.name || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">{book.type}</td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">
                                        {formatDistanceToNow(new Date(book.createdAt), { addSuffix: true })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {book.fileUrl && (
                                                <a
                                                  href={book.fileUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="p-2 inline-block hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 transition-colors"
                                                  title="Preview file"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none transition-colors">
                                                    {approvingId === book.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                                                    ) : (
                                                        <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                                                    )}
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                    <DropdownMenuItem
                                                        onClick={() => handleApprove(book.id)}
                                                        className="gap-2 text-emerald-600 focus:text-emerald-700"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedBook(book);
                                                            setRejectModalOpen(true);
                                                        }}
                                                        className="gap-2 text-rose-600 focus:text-rose-700"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Reject
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <FormModal open={rejectModalOpen} setOpen={setRejectModalOpen}>
                <div className="p-8 font-poppins">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Reject Upload</h2>
                    <p className="text-sm text-zinc-500 mb-6">Let the uploader know why this material isn&apos;t being published (optional).</p>

                    <form onSubmit={handleReject} className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Reason</label>
                           <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="e.g. Duplicate of an existing resource, wrong course, low quality scan..."
                                rows={3}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>

                        <button
                            disabled={isSubmitting}
                            className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            {isSubmitting ? "Rejecting..." : "Reject Upload"}
                        </button>
                    </form>
                </div>
            </FormModal>
        </div>
    );
}
