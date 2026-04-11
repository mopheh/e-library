"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Send, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Type definitions based on our schema
type Author = { id: string; fullName: string };
type CommentType = { id: string; content: string; createdAt: string; author: Author };
type ThreadType = { id: string; title: string; content: string; createdAt: string; author: Author };

// ==========================================
// 1. INDIVIDUAL THREAD VIEW (COMMENTS)
// ==========================================
function ThreadDetail({ thread, onBack }: { thread: ThreadType; onBack: () => void }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", thread.id],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/threads/${thread.id}/comments`, { signal });
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json() as Promise<CommentType[]>;
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/threads/${thread.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onMutate: async (newContent) => {
      await queryClient.cancelQueries({ queryKey: ["comments", thread.id] });
      const previousComments = queryClient.getQueryData(["comments", thread.id]);
      
      queryClient.setQueryData(["comments", thread.id], (old: any) => [
        ...(old || []),
        {
          id: `temp-${Date.now()}`,
          content: newContent,
          createdAt: new Date().toISOString(),
          author: { id: user?.id || "temp", fullName: user?.fullName || "You" },
        },
      ]);
      setNewComment("");
      return { previousComments };
    },
    onError: (err, newContent, context) => {
      toast.error("Failed to post comment");
      queryClient.setQueryData(["comments", thread.id], context?.previousComments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", thread.id] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Discussions
      </Button>

      <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border">
        <h2 className="text-xl font-bold font-poppins">{thread.title}</h2>
        <div className="text-sm text-muted-foreground mt-1 mb-4 flex items-center">
          <span className="font-medium mr-2">{thread.author.fullName}</span>
          <span>•</span>
          <span className="ml-2">{format(new Date(thread.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{thread.content}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold font-open-sans">Comments</h3>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
            ))}
          </div>
        ) : comments?.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">No comments yet. Be the first to reply!</p>
        ) : (
          <div className="space-y-3">
            {comments?.map((comment) => (
              <div key={comment.id} className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">{comment.author.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 pt-4 border-t">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1"
            disabled={commentMutation.isPending}
          />
          <Button type="submit" disabled={commentMutation.isPending || !newComment.trim()}>
            {commentMutation.isPending ? "..." : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MAIN THREADS LIST
// ==========================================
export default function CourseDiscussions({ courseId, courseName }: { courseId: string; courseName: string }) {
  const queryClient = useQueryClient();
  const [activeThread, setActiveThread] = useState<ThreadType | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads", courseId],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/courses/${courseId}/threads`, { signal });
      if (!res.ok) throw new Error("Failed to load threads");
      return res.json() as Promise<ThreadType[]>;
    },
    enabled: !!courseId,
  });

  const threadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      if (!res.ok) throw new Error("Failed to create thread");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["threads", courseId] });
      const previousThreads = queryClient.getQueryData(["threads", courseId]);
      
      queryClient.setQueryData(["threads", courseId], (old: any) => [
        {
          id: `temp-${Date.now()}`,
          title: newTitle,
          content: newContent,
          createdAt: new Date().toISOString(),
          // Use a generic placeholder since we assume the author is the current user viewing this
          author: { id: "temp", fullName: "You" },
        },
        ...(old || []),
      ]);
      
      setIsComposing(false);
      setNewTitle("");
      setNewContent("");
      return { previousThreads };
    },
    onSuccess: () => {
      toast.success("Discussion posted!");
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["threads", courseId], context?.previousThreads);
      toast.error("Failed to post discussion");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["threads", courseId] });
    },
  });

  const handlePostThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.warning("Title and content are required.");
      return;
    }
    threadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {activeThread ? (
        <ThreadDetail thread={activeThread} onBack={() => setActiveThread(null)} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-poppins">{courseName} Discussions</h2>
              <p className="text-sm text-muted-foreground">Collaborate with your peers</p>
            </div>
            {!isComposing && (
              <Button onClick={() => setIsComposing(true)}>New Discussion</Button>
            )}
          </div>

      {isComposing && (
        <form onSubmit={handlePostThread} className="bg-white dark:bg-zinc-950 p-4 rounded-lg border space-y-4">
          <Input 
            placeholder="Discussion Title" 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
            disabled={threadMutation.isPending}
          />
          <textarea
            className="w-full h-32 p-3 text-sm border rounded-md bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="What do you want to discuss?"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            disabled={threadMutation.isPending}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsComposing(false)}>Cancel</Button>
            <Button type="submit" disabled={threadMutation.isPending}>
              {threadMutation.isPending ? "Posting..." : "Post Thread"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
          ))}
        </div>
      ) : threads?.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-dashed">
          <MessageSquare className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <h3 className="font-semibold">No discussions yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Start the conversation by posting a new thread.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {threads?.map((thread) => (
            <div 
              key={thread.id} 
              onClick={() => setActiveThread(thread)}
              className="group bg-white dark:bg-zinc-950 p-4 rounded-lg border cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-lg font-poppins group-hover:text-blue-600 transition-colors">{thread.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{thread.content}</p>
              <div className="flex items-center text-xs text-muted-foreground mt-4 pt-4 border-t">
                <span className="font-medium mr-2">{thread.author.fullName}</span>
                <span>•</span>
                <span className="ml-2">{format(new Date(thread.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
