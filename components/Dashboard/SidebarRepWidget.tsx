"use client";
import { useEffect, useState } from "react";
import { UserCircle, MessageSquare, Send, PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function CompactRepWidget() {
    const { user } = useUser();
    const isRep = user?.unsafeMetadata?.role === "FACULTY REP" || user?.unsafeMetadata?.role === "faculty-rep"  || false;

    const [rep, setRep] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
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

        if (isRep) {
            const hasSeenWelcome = localStorage.getItem(`rep_welcome_${user?.id}`);
            if (!hasSeenWelcome) {
                setWelcomeModalOpen(true);
            }
        }
    }, [isRep, user?.id]);

    const handleAcknowledgeWelcome = () => {
        localStorage.setItem(`rep_welcome_${user?.id}`, "true");
        setWelcomeModalOpen(false);
    };

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
            <div className="flex items-center gap-3 py-3 px-4 rounded-2xl animate-pulse">
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                <div className="space-y-2 flex-1">
                    <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                </div>
            </div>
        );
    }

    // Hide if no rep exists and the user is themselves a rep (to avoid messaging themselves)
    if (!rep && isRep) return null;

    return (
        <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
            {rep ? (
                <div 
                  onClick={() => setMessageModalOpen(true)}
                  className="flex items-center gap-3 py-2 px-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 w-full group"
                >
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-semibold text-xs shrink-0 shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
                        {rep.imageUrl ? (
                             <img src={rep.imageUrl} alt={rep.fullName} className="h-full w-full object-cover" />
                        ) : (
                             rep.fullName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="font-poppins text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                {rep.fullName}
                            </span>
                        </div>
                        <span className="text-[10px] font-poppins text-zinc-500 dark:text-zinc-400 capitalize truncate flex items-center gap-1">
                             <MessageSquare className="w-3 h-3 text-indigo-400" />
                             {rep.repType || "Rep"}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 py-2 px-3 rounded-2xl w-full">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 shrink-0">
                        <UserCircle className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-poppins text-xs font-poppins font-medium text-zinc-500 dark:text-zinc-400">
                            No Rep Assigned
                        </span>
                    </div>
                </div>
            )}

            <Dialog open={welcomeModalOpen} onOpenChange={setWelcomeModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PartyPopper className="w-5 h-5 text-indigo-500" />
                            Congratulations!
                        </DialogTitle>
                        <DialogDescription className="text-sm pt-2">
                            You have been officially assigned as a <strong>Faculty Representative</strong>! 
                            <br/><br/>
                            You now have access to upload premium materials (Textbooks, Past Questions, Notes) directly to your department. 
                            <br/><br/>
                            <strong>To get started:</strong> Click on <strong>Manage Data</strong> in your sidebar menu, then click <strong>Add New</strong> on the Books table.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                         <Button onClick={handleAcknowledgeWelcome} className="w-full">
                            Awesome, let's go!
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Message Faculty Representative</DialogTitle>
                        <DialogDescription>
                             Send a question or complaint to {rep?.fullName}. They will receive your message and metric unit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <Textarea 
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[120px] resize-none"
                         />
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setMessageModalOpen(false)} disabled={isSubmitting}>
                            Cancel
                         </Button>
                         <Button onClick={handleSendMessage} disabled={!message.trim() || isSubmitting} className="gap-2">
                            {isSubmitting ? "Sending..." : <><Send className="w-4 h-4"/> Send Message</>}
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
