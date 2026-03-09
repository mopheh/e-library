"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2, ThumbsUp, Plus, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const SurvivalGuidesList = ({ courseId }: { courseId: string }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: guides, isLoading } = useQuery({
    queryKey: ["survivalGuides", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/guides`);
      if (!res.ok) throw new Error("Failed to load guides");
      return res.json();
    },
  });

  const createGuide = useMutation({
    mutationFn: async (newGuide: { title: string; content: string }) => {
      const res = await fetch(`/api/courses/${courseId}/guides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGuide),
      });
      if (!res.ok) throw new Error("Failed to create guide");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survivalGuides", courseId] });
      toast.success("Survival guide published successfully!");
      setIsOpen(false);
      setTitle("");
      setContent("");
    },
    onError: () => toast.error("Failed to publish guide."),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createGuide.mutate({ title, content });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold font-poppins flex items-center gap-2">
             <Quote className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
             Senior Survival Guides
          </h3>
          <p className="text-sm text-muted-foreground font-open-sans">
             Tips, tricks, and advice from senior students who have faced this course and conquered it.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
               <Plus className="w-4 h-4 mr-2" /> Write a Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle className="font-poppins text-xl">Write a Survival Guide</DialogTitle>
                <DialogDescription className="font-open-sans">
                  Share your strategy for passing this course. What should junior students focus on? What textbooks are actually useful?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold">Guide Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., How to Survive EEE301: The Ultimate Guide"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="font-semibold">Core Advice</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Write your study tips, important topics, and advice here..."
                    className="min-h-[200px] resize-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createGuide.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {createGuide.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</> : "Publish Guide"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!guides || guides.length === 0 ? (
        <div className="text-center p-16 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="bg-white dark:bg-zinc-900 w-20 h-20 flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-sm border border-emerald-100 dark:border-emerald-800/30">
            <BookOpen className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2 font-poppins">No Guides Found</h3>
          <p className="text-base text-muted-foreground max-w-md mx-auto font-open-sans">
            It looks like no one has written a guide for this course yet. Be the first to help out the juniors!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide: any) => (
             <Card key={guide.id} className="flex flex-col h-full hover:shadow-lg transition-all border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
               <CardHeader className="pb-3 pt-6 flex-grow">
                 <CardTitle className="text-xl font-poppins leading-snug line-clamp-2 text-foreground mb-4">
                   {guide.title}
                 </CardTitle>
                 <div className="flex items-center gap-3">
                   <Avatar className="w-8 h-8 rounded-full">
                     <AvatarFallback className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-xs font-bold">
                       {guide.author?.fullName?.[0] || "?"}
                     </AvatarFallback>
                   </Avatar>
                   <div className="flex flex-col">
                     <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {guide.author?.fullName || "Senior Student"}
                     </span>
                     <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(guide.createdAt), { addSuffix: true })}
                     </span>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="pb-6">
                 <p className="text-sm text-muted-foreground line-clamp-4 font-open-sans leading-relaxed">
                   {guide.content}
                 </p>
               </CardContent>
               <CardFooter className="pt-0 mt-auto border-t border-gray-50 dark:border-zinc-800/50 px-6 py-4 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/30">
                 <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold h-8 px-2 -ml-2">
                    Read Full Guide
                 </Button>
                 <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                   <ThumbsUp className="w-3.5 h-3.5" />
                   {guide.upvotes}
                 </div>
               </CardFooter>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
};
