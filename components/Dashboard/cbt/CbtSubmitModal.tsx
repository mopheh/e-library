"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CbtSubmitModal({ open, onConfirm, onCancel, loading }: any) {
    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Test?</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to submit? You cannot change answers afterward.</p>
                <div className="flex justify-end space-x-3 mt-4">
                    <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
                    <Button onClick={onConfirm} disabled={loading}>
                        {loading ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
