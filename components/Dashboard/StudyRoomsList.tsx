"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MonitorPlay, Users, Plus, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";

export const StudyRoomsList = ({ courseId }: { courseId: string }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["studyRooms", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/study-rooms`);
      if (!res.ok) throw new Error("Failed to load study rooms");
      return res.json();
    },
  });

  const createRoom = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/study-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studyRooms", courseId] });
      setOpen(false);
      setName("");
      setDescription("");
      toast.success("Study room created!");
    },
    onError: () => {
      toast.error("Failed to create study room.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold font-poppins">Collaborative Study Rooms</h3>
          <p className="text-sm text-muted-foreground font-open-sans">
            Join live sessions to study together, share active notes, and solve past questions.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-poppins">Create a Study Room</DialogTitle>
              <DialogDescription className="font-open-sans">
                Start a live session for this course. Other students will be able to join.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="e.g. Kirchhoff's Laws Quick Review"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomDesc">Description (Optional)</Label>
                <Textarea
                  id="roomDesc"
                  placeholder="What will you be discussing?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700" 
                onClick={() => createRoom.mutate()} 
                disabled={!name || createRoom.isPending}
              >
                {createRoom.isPending ? "Creating..." : "Create Room"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!rooms || rooms.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 shadow-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-6">
            <MonitorPlay className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2 font-poppins">No Active Rooms</h3>
          <p className="text-base text-muted-foreground max-w-sm mx-auto font-open-sans mb-6">
            There are no active study sessions for this course right now. Be the first to start one!
          </p>
          <Button variant="outline" onClick={() => setOpen(true)} className="font-semibold">
            Start a Study Room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {rooms.map((room: any) => (
            <Card key={room.id} className="flex flex-col h-full hover:shadow-2xl transition-all duration-300 border-zinc-200 dark:border-zinc-800 overflow-hidden group rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
              <div className="h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="pb-4 flex-grow pt-8 px-8">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-widest">
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     Live Now
                   </div>
                   <div className="flex items-center text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700/50">
                     <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> {room.memberCount} Studying
                   </div>
                </div>
                
                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                  {room.name}
                </CardTitle>
                
                <CardDescription className="line-clamp-3 text-base mt-4 font-open-sans text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {room.description || "Join this collaborative space to master this course with your peers through real-time discussion and shared notes."}
                </CardDescription>
              </CardHeader>

              <CardContent className="py-0 pb-6 px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-200 dark:border-indigo-800">
                      {room.host?.fullName?.charAt(0) || "U"}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Hosted by</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{room.host?.fullName || "Verified Student"}</span>
                   </div>
                </div>
                <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 italic">
                  {formatDistanceToNow(new Date(room.createdAt))} ago
                </div>
              </CardContent>

              <CardFooter className="pt-6 pb-8 px-8 border-t border-zinc-100 dark:border-zinc-800/50 mt-auto bg-zinc-50/50 dark:bg-zinc-900/40">
                <Link href={`/dashboard/study-rooms/${room.id}`} className="w-full">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-7 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 text-base">
                    {room.isMember ? "Continue Session" : "Join Study Group"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
