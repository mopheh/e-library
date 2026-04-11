"use client";

import React, { useEffect, useState } from "react";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getVerificationRequests } from "./actions";
import { approveVerification, rejectVerification, getSignedProofUrl } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewing, setIsViewing] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getVerificationRequests();
      setRequests(data);
    } catch (e) {
      toast.error("Failed to fetch verification requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    const res = await approveVerification(id);
    if (res.success) {
      toast.success("Verification approved!");
      fetchRequests();
    } else {
      toast.error(res.error || "Failed to approve.");
    }
  };

  const handleReject = async (id: string) => {
    const res = await rejectVerification(id);
    if (res.success) {
      toast.success("Verification rejected!");
      fetchRequests();
    } else {
      toast.error(res.error || "Failed to reject.");
    }
  };

  const handleViewDoc = async (proofUrl: string, id: string) => {
    setIsViewing(id);
    try {
      const res = await getSignedProofUrl(proofUrl);
      if (res.success && res.url) {
        window.open(res.url, "_blank");
      } else {
        toast.error(res.error || "Failed to access document.");
      }
    } catch (error) {
      toast.error("An error occurred while opening the document.");
    } finally {
      setIsViewing(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500 font-light font-poppins text-xs">Loading requests...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-white dark:bg-zinc-950 rounded-2xl min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="mb-4 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 p-0 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to the previous page
          </Button>
          <h1 className="text-2xl font-medium font-cabin mb-1 text-zinc-900 dark:text-white">Aspirant Verifications</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-poppins font-light">Review admission proofs to upgrade Aspirants to Students.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center p-12 py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 text-xs font-poppins font-light">No pending verification requests.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
              <TableRow>
                <TableHead>Student Details</TableHead>
                <TableHead>JAMB No.</TableHead>
                <TableHead>Level & Year</TableHead>
                <TableHead>Department / Faculty</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} className="font-poppins">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-zinc-100 dark:border-zinc-800">
                        <AvatarImage src={req.user?.imageUrl} alt={req.user?.fullName} />
                        <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {req.user?.fullName?.split(" ").map((n: any) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium font-manrope text-zinc-900 dark:text-white text-sm">{req.user?.fullName}</div>
                        <div className="text-xs text-zinc-500">{req.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs font-normal bg-zinc-100 dark:bg-zinc-800 break-all">{req.jambNo}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {req.level} Level<br />
                    <span className="text-zinc-500 text-xs">Class of {req.admissionYear}</span>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    <span className="font-normal font-manrope text-zinc-800 dark:text-zinc-200">{req.department?.name}</span><br />
                    <span className="text-xs font-light text-zinc-500">{req.faculty?.name}</span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost"
                      size="sm"
                      disabled={isViewing === req.id}
                      onClick={() => handleViewDoc(req.proofUrl, req.id)}
                      className="flex font-manrope items-center gap-1.5 text-xs font-normal text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 p-2 h-auto rounded-lg transition-colors w-fit"
                    >
                      <Eye className="w-3.5 h-3.5" /> {isViewing === req.id ? "Opening..." : "View Doc"}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="xs" onClick={() => handleReject(req.id)} className="text-red-600 font-light hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900">
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button size="xs" onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700 font-normal text-white">
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
