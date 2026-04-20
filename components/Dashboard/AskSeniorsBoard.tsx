"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ThumbsUp, MessageCircle, MoreHorizontal, UserCircle2, Loader2, Sparkles, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  targetLevel: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  authorName: string;
  authorRole: string;
  authorLevel: string;
  upvotes?: number;
}

function QuestionReplies({ questionId }: { questionId: string }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  
  const { data: replies, isLoading } = useQuery({
    queryKey: ["seniorQaAnswers", questionId],
    queryFn: async () => {
      const res = await fetch(`/api/senior-qa/${questionId}/answers`);
      if (!res.ok) throw new Error("Failed to load replies");
      return res.json();
    },
  });

  const postReply = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/senior-qa/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      if (!res.ok) throw new Error("Failed to post reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seniorQaAnswers", questionId] });
      setReply("");
      toast.success("Reply posted successfully!");
    },
    onError: () => toast.error("Failed to post reply"),
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="flex gap-3">
        <Textarea 
          placeholder="Write your reply..." 
          className="min-h-[80px] rounded-xl resize-none bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button 
          onClick={() => postReply.mutate()} 
          disabled={!reply.trim() || postReply.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9"
          size="sm"
        >
          {postReply.isPending ? "Posting..." : <><Send className="w-3.5 h-3.5 mr-2" /> Post Reply</>}
        </Button>
      </div>
      
      <div className="space-y-4 mt-6">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !replies || replies.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">No replies yet. Be the first to answer!</div>
        ) : (
          replies.map((r: any) => (
            <div key={r.id} className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {r.authorName?.[0] || "?"}
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-foreground">{r.authorName || "Anonymous"}</p>
                    <p className="text-[10px] text-muted-foreground">{r.authorLevel} Level Student • {formatDistanceToNow(new Date(r.createdAt))} ago</p>
                 </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 pl-9 font-open-sans">
                {r.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const AskSeniorsBoard = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetLevel, setTargetLevel] = useState("ALL");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const upvoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/senior-qa/${id}/upvote`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to upvote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seniorQa"] });
    },
  });

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["seniorQa", filter],
    queryFn: async () => {
      const res = await fetch(`/api/senior-qa?targetLevel=${filter}`);
      if (!res.ok) throw new Error("Failed to load questions");
      return res.json();
    },
  });

  const postQuestion = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/senior-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, targetLevel, isAnonymous }),
      });
      if (!res.ok) throw new Error("Failed to post question");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seniorQa"] });
      setOpen(false);
      setTitle("");
      setContent("");
      setTargetLevel("ALL");
      setIsAnonymous(false);
      toast.success("Question posted successfully. Wait for your seniors to reply!");
    },
    onError: () => toast.error("Failed to post question"),
  });

  const filteredQuestions = questions?.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Sidebar - Filters & Info */}
      <div className="w-full md:w-64 shrink-0 space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-cabin font-medium tracking-tight text-lg mb-2 text-indigo-950 dark:text-indigo-100">Ask the Seniors</h3>
          <p className="text-xs text-indigo-800/80 font-light dark:text-indigo-300 font-poppins">
            Have questions about a difficult course, career paths, or navigating campus? Ask the seniors in your department.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-black text-xs font-normal text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-sm font-poppins rounded-xl h-12">
              <Plus className="w-4 h-4 mr-2" /> Ask a Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-poppins font-normal">Ask the Seniors</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="font-light font-poppins text-xs">Who are you asking?</Label>
                <Select value={targetLevel} onValueChange={setTargetLevel}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select target level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Anyone (All Levels)</SelectItem>
                    <SelectItem value="200">200 Level Students</SelectItem>
                    <SelectItem value="300">300 Level Students</SelectItem>
                    <SelectItem value="400">400 Level Students</SelectItem>
                    <SelectItem value="500">500 Level Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="font-light font-poppins text-xs">Question Summary</Label>
                <Input id="title" className="rounded-xl text-xs" placeholder="e.g. How to prepare for MTH 101?" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content" className="font-light font-poppins text-xs">Details</Label>
                <Textarea 
                  id="content" 
                  className="min-h-[120px] rounded-xl resize-none text-xs" 
                  placeholder="Elaborate on your question here..." 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                />
              </div>
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous" className="text-xs font-poppins font-medium">Post Anonymously</Label>
                  <p className="text-xs text-muted-foreground font-light font-poppins">Your name will be hidden from everyone.</p>
                </div>
                <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl font-poppins text-xs font-medium">Cancel</Button>
              <Button 
                onClick={() => postQuestion.mutate()} 
                disabled={!title || !content || postQuestion.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-poppins text-xs font-medium"
              >
                {postQuestion.isPending ? "Posting..." : <><Send className="w-4 h-4 mr-2" /> Post Question</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-3">
          <Label className="text-xs font-semibold font-poppins text-muted-foreground uppercase tracking-wider">Filter by Level</Label>
          <Tabs value={filter} onValueChange={setFilter} orientation="vertical" className="w-full">
            <TabsList className="flex flex-col h-auto font-manrope text-xs font-light bg-transparent items-start space-y-1 p-0">
              <TabsTrigger value="ALL" className="w-full justify-start rounded-lg px-3 py-2 data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-none">Everyone</TabsTrigger>
              <TabsTrigger value="400" className="w-full justify-start rounded-lg px-3 py-2 data-[state=active]:bg-emerald-50 text-emerald-700 dark:text-emerald-400 dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-none">To: 400 Lvl</TabsTrigger>
              <TabsTrigger value="500" className="w-full justify-start rounded-lg px-3 py-2 data-[state=active]:bg-amber-50 text-amber-700 dark:text-amber-400 dark:data-[state=active]:bg-amber-900/20 data-[state=active]:shadow-none">To: 500 Lvl</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search questions..." 
            className="pl-10 h-12 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Question Feed */}
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !filteredQuestions || filteredQuestions.length === 0 ? (
          <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 shadow-sm">
            <div className="bg-zinc-50 dark:bg-zinc-900 w-16 h-16 flex items-center justify-center rounded-full mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium tracking-tight text-foreground mb-1 font-cabin">No questions found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto font-poppins font-light">
              Be the first to ask a question to your seniors, or try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800/50 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {q.isAnonymous ? (
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                        <UserCircle2 className="w-6 h-6 text-zinc-400" />
                      </div>
                    ) : (
                      <Avatar className="w-10 h-10 border border-zinc-100 dark:border-zinc-800">
                        <AvatarFallback className="bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/40 dark:text-blue-300">
                          {q.authorName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="text-xs font-semibold font-poppins text-foreground">
                          {q.authorName}
                        </p>
                        {q.targetLevel !== "ALL" && (
                          <Badge variant="secondary" className="bg-indigo-50 font-normal text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 h-5 px-1.5 text-[10px]">
                            To: {q.targetLevel} Lvl
                          </Badge>
                        )}
                      </div>
                     
                      <p className="text-[10px] font-light text-muted-foreground font-poppins">
                        {q.authorRole === "Student" && <span>{q.authorLevel} Level •</span>}
                        {formatDistanceToNow(new Date(q.createdAt))} ago
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                
                <h4 className="font-semibold text-lg font-karla mb-2 text-foreground">
                  {q.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-poppins line-clamp-3 mb-5">
                  {q.content}
                </p>

                <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
                  <div className="flex items-center gap-4">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={(e) => {
                         e.stopPropagation();
                         upvoteMutation.mutate(q.id);
                       }}
                       disabled={upvoteMutation.isPending}
                       className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 h-8 px-2 -ml-2 rounded-lg text-xs font-medium font-poppins"
                     >
                        <ThumbsUp className="w-4 h-4 mr-1" /> {q.upvotes || 0} Upvotes
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setExpandedQuestion(expandedQuestion === q.id ? null : q.id);
                       }}
                       className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 h-8 px-2 rounded-lg text-xs font-medium font-poppins"
                     >
                        <MessageCircle className="w-4 h-4 mr-1" /> {expandedQuestion === q.id ? 'Close Replies' : 'Reply'}
                     </Button>
                  </div>
                  
                  {expandedQuestion === q.id && (
                    <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/50" onClick={(e) => e.stopPropagation()}>
                      <QuestionReplies questionId={q.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
