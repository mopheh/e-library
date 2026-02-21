"use client";
import { useEffect, useState } from "react";
import { UserCircle, MessageSquare, Send, PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function MobileRepFloatingButton() {
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
    }, []);

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

    if (loading || (!rep && isRep)) return null; // Don't show anything while loading or if self is sole rep
    if (!rep) return null; // Don't clog mobile UI if no rep exists

    return (
        <>
            <button
                onClick={() => setMessageModalOpen(true)}
                className="fixed bottom-24 right-4 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-300 md:hidden flex items-center justify-center animate-bounce-short"
                aria-label="Contact Faculty Representative"
            >
                <div className="relative">
                     <MessageSquare className="w-6 h-6" />
                     <span className="absolute -top-1 -right-1 flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-100 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-indigo-600"></span>
                     </span>
                </div>
            </button>

            <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 font-semibold text-lg shrink-0 shadow-sm">
                                {rep.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                                <DialogTitle>Message {rep.fullName}</DialogTitle>
                                <DialogDescription className="text-xs">
                                     {rep.repType || "Rep"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                         <Textarea 
                            placeholder="Type your question or concern here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[120px] resize-none focus-visible:ring-indigo-500"
                         />
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                         <Button variant="outline" onClick={() => setMessageModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                            Cancel
                         </Button>
                         <Button onClick={handleSendMessage} disabled={!message.trim() || isSubmitting} className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? "Sending..." : <><Send className="w-4 h-4"/> Send Message</>}
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
