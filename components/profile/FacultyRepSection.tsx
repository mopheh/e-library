"use client";

import { useEffect, useState } from "react";
import { UserCircle, MessageSquare, Send, PartyPopper, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FacultyRepSection() {
    const { user } = useUser();
    const isRep = user?.unsafeMetadata?.role === "FACULTY REP" || user?.unsafeMetadata?.role === "faculty-rep"  || false;

    const [rep, setRep] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchRep = async () => {
            try {
                const res = await fetch("/api/student/faculty-rep");
                if (res.ok) {
                    const data = await res.json();
                    setRep(data.rep);
                }
            } catch (error) {
                console.error("Failed to load rep", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRep();
    }, [user?.id]);

    const handleSendMessage = async () => {
        if (!message.trim() || !rep) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/student/contact-rep", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ facultyRepId: rep.id, message }),
            });

            if (!res.ok) throw new Error("Failed to send message.");

            toast.success("Message sent to your Faculty Representative.");
            setMessage("");
            setMessageModalOpen(false);
        } catch (error: any) {
             toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <Card className="animate-pulse border-none bg-zinc-50 dark:bg-zinc-900/50">
                <CardContent className="h-24"></CardContent>
            </Card>
        );
    }

    if (!rep && isRep) return null;

    return (
        <Card className="overflow-hidden border-zinc-100 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-indigo-50/10 to-transparent dark:from-indigo-900/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Faculty Support
                </CardTitle>
            </CardHeader>
            <CardContent>
                {rep ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                        <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold text-2xl shrink-0 shadow-inner overflow-hidden border-2 border-white dark:border-zinc-800">
                            {rep.imageUrl ? (
                                 <img src={rep.imageUrl} alt={rep.fullName} className="h-full w-full object-cover" />
                            ) : (
                                 rep.fullName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-1">
                            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{rep.fullName}</h4>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide flex items-center justify-center sm:justify-start gap-2">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {rep.repType || "Faculty Representative"}
                            </p>
                            <p className="text-xs text-zinc-400 mt-2 max-w-sm">Contact your representative for complaints, course issues, or material requests.</p>
                        </div>
                        <Button 
                            onClick={() => setMessageModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6"
                        >
                            Send Message
                        </Button>
                    </div>
                ) : (
                    <div className="py-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">No Faculty Representative assigned yet.</p>
                    </div>
                )}
            </CardContent>

            <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Message Representative</DialogTitle>
                        <DialogDescription>
                             Send a question or complaint to {rep?.fullName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <Textarea 
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[150px] resize-none rounded-xl"
                         />
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setMessageModalOpen(false)} disabled={isSubmitting}>
                            Cancel
                         </Button>
                         <Button onClick={handleSendMessage} disabled={!message.trim() || isSubmitting} className="gap-2 bg-indigo-600">
                            {isSubmitting ? "Sending..." : <><Send className="w-4 h-4"/> Send Message</>}
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
