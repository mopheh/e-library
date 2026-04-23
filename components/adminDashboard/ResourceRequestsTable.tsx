"use client";

import React, { useState, useEffect } from "react";
import { getResourceRequests, fulfillResourceRequest, rejectResourceRequest } from "@/actions/resources";
import { 
    CheckCircle, 
    XCircle, 
    MoreHorizontal, 
    Loader2, 
    ExternalLink, 
    Inbox,
    Filter,
    UploadCloud
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

export default function ResourceRequestsTable() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [fulfillUrl, setFulfillUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadRequests = async () => {
        setIsLoading(true);
        const res = await getResourceRequests();
        if (res.success) {
            setRequests(res.data || []);
        } else {
            toast.error(res.error || "Failed to load requests");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleFulfill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fulfillUrl) return toast.error("Please provide a URL");

        setIsSubmitting(true);
        const res = await fulfillResourceRequest(selectedRequest.id, fulfillUrl);
        if (res.success) {
            toast.success("Request fulfilled successfully");
            setFulfillModalOpen(false);
            setFulfillUrl("");
            loadRequests();
        } else {
            toast.error(res.error || "Failed to fulfill request");
        }
        setIsSubmitting(false);
    };

    const handleReject = async (requestId: string) => {
        if (!confirm("Are you sure you want to reject this request?")) return;
        
        const res = await rejectResourceRequest(requestId, "Unspecified reason");
        if (res.success) {
            toast.success("Request rejected");
            loadRequests();
        } else {
            toast.error(res.error || "Failed to reject request");
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden font-poppins">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-950">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        Resource Requests <Inbox className="w-5 h-5 text-blue-600" />
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Manage and fulfill student material requests.</p>
                </div>
                <button 
                   onClick={loadRequests} 
                   className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <Filter className="w-4 h-4 text-zinc-400" />
                </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-[10px] uppercase tracking-widest font-bold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Requested</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="text-xs text-zinc-400">Loading requests...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 text-sm">
                                    No resource requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                                                {req.user.fullName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{req.user.fullName}</p>
                                                <p className="text-[10px] text-zinc-500">{req.department.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                            {req.course?.courseCode || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1 max-w-[200px]">
                                            {req.description}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            req.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                            req.status === "FULFILLED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                        }`}>
                                            <span className={`w-1 rounded-full aspect-square ${
                                                req.status === "PENDING" ? "bg-amber-500 animate-pulse" :
                                                req.status === "FULFILLED" ? "bg-emerald-500" :
                                                "bg-rose-500"
                                            }`} />
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">
                                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {req.status === "PENDING" ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none transition-colors">
                                                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setFulfillModalOpen(true);
                                                        }}
                                                        className="gap-2 text-emerald-600 focus:text-emerald-700"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Fulfill
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleReject(req.id)}
                                                        className="gap-2 text-rose-600 focus:text-rose-700"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Reject
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : req.status === "FULFILLED" ? (
                                            <a 
                                              href={req.fulfilledUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="p-2 inline-block hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        ) : "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <FormModal open={fulfillModalOpen} setOpen={setFulfillModalOpen}>
                <div className="p-8 font-poppins">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Fulfill Request</h2>
                    <p className="text-sm text-zinc-500 mb-6">Enter the URL of the resource to fulfill this request.</p>
                    
                    <form onSubmit={handleFulfill} className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Resource URL</label>
                           <input 
                                type="url" 
                                value={fulfillUrl}
                                onChange={(e) => setFulfillUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                required
                            />
                        </div>

                        <button 
                            disabled={isSubmitting}
                            className="w-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                            {isSubmitting ? "Fulfilling..." : "Fulfill Request"}
                        </button>
                    </form>
                </div>
            </FormModal>
        </div>
    );
}
