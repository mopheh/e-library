"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUsers } from "@/hooks/useUsers";
import { Input } from "@/components/ui/input";

export default function AddRepModal({ open, onCancel, facultyId, facultyName }: any) {
    const { data: users, isLoading } = useUsers(facultyId); // Fetch users belonging to this faculty
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter users visually based on email or name
    const filteredUsers = users?.filter((u: any) => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleAssign = async (userId: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/assign-rep", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIdToAssign: userId })
            });

            if (!res.ok) throw new Error("Failed to assign representative.");
            
            toast.success("Faculty Representative assigned successfully!");
            onCancel(); // close modal
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-cairo">Assign Representative</DialogTitle>
                    <DialogDescription className="font-poppins text-xs">
                        Assign a Student from <b>{facultyName}</b> to become the Faculty Representative.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Input 
                        placeholder="Search by email or name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="font-poppins text-sm"
                    />

                    <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2 border-zinc-200 dark:border-zinc-800">
                        {isLoading && <p className="text-sm text-center text-zinc-500 py-4">Loading eligible students...</p>}
                        
                        {!isLoading && filteredUsers.length === 0 && (
                            <p className="text-sm text-center text-zinc-500 py-4">No students found in this faculty.</p>
                        )}

                        {!isLoading && filteredUsers.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
                                <div>
                                    <p className="text-sm font-medium font-poppins">{u.fullName}</p>
                                    <p className="text-xs text-zinc-500">{u.email}</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant={u.role === "FACULTY REP" ? "secondary" : "default"}
                                    disabled={isSubmitting || u.role === "FACULTY REP"}
                                    onClick={() => handleAssign(u.id)}
                                >
                                    {u.role === "FACULTY REP" ? "Current Rep" : "Assign"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end mt-2">
                     <Button variant="outline" onClick={onCancel}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
