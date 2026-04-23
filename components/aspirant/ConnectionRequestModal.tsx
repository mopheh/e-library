"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, Loader2 } from "lucide-react";
import { sendConnectionRequest } from "@/actions/connect";
import { toast } from "sonner";

interface ConnectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStudent: {
    id: string;
    name: string;
  } | null;
  onSuccess: () => void;
}

export default function ConnectionRequestModal({ isOpen, onClose, targetStudent, onSuccess }: ConnectionRequestModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!targetStudent) return;
    
    setLoading(true);
    try {
      const res = await sendConnectionRequest(targetStudent.id);
      if (res.success) {
        toast.success(res.message || `Request sent to ${targetStudent.name}`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to send request");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
             <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-xl font-cabin">Connect with {targetStudent?.name}</DialogTitle>
          <DialogDescription className="font-poppins text-sm font-light">
            Connections allow you to see each other's activity and message each other directly once accepted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
           <label className="text-xs font-semibold text-zinc-500 uppercase tracking-tighter mb-2 block">Personal Note (Optional)</label>
           <Textarea 
             placeholder="Hi! I'd like to ask some questions about your department..." 
             className="min-h-[100px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl resize-none focus:ring-blue-500"
           />
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-semibold flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
