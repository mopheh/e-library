"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Briefcase, ExternalLink, Calendar, Loader2, Award, TerminalSquare, Building2, Globe } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  url: string;
  type: string;
  deadline: string | null;
  createdAt: string;
}

export const OpportunitiesBoard = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  
  // Form State
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("INTERNSHIP");
  const [deadline, setDeadline] = useState("");

  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["opportunities", filter],
    queryFn: async () => {
      const qs = filter !== "ALL" ? `?type=${filter}` : "";
      const res = await fetch(`/api/opportunities${qs}`);
      if (!res.ok) throw new Error("Failed to load opportunities");
      return res.json();
    },
  });

  const createOpportunity = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, url, type, deadline }),
      });
      if (!res.ok) throw new Error("Failed to post opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setOpen(false);
      setTitle("");
      setCompany("");
      setUrl("");
      setType("INTERNSHIP");
      setDeadline("");
      toast.success("Opportunity posted successfully");
    },
    onError: () => toast.error("Failed to post opportunity"),
  });

  const getIcon = (opType: string) => {
    switch(opType) {
      case "INTERNSHIP": return <Briefcase className="w-5 h-5 text-blue-500" />;
      case "SCHOLARSHIP": return <Award className="w-5 h-5 text-amber-500" />;
      case "HACKATHON": return <TerminalSquare className="w-5 h-5 text-purple-500" />;
      case "JOB": return <Building2 className="w-5 h-5 text-emerald-500" />;
      default: return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBadgeColor = (opType: string) => {
    switch(opType) {
      case "INTERNSHIP": return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "SCHOLARSHIP": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
      case "HACKATHON": return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "JOB": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="bg-white font-poppins dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 h-11 p-1">
            <TabsTrigger value="ALL" className="rounded-md text-xs">All</TabsTrigger>
            <TabsTrigger value="INTERNSHIP" className="rounded-md shrink-0 text-xs">Internships</TabsTrigger>
            <TabsTrigger value="SCHOLARSHIP" className="rounded-md shrink-0 text-xs">Scholarships</TabsTrigger>
            <TabsTrigger value="HACKATHON" className="rounded-md shrink-0 text-xs">Hackathons</TabsTrigger>
            <TabsTrigger value="JOB" className="rounded-md shrink-0 text-xs">Jobs</TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-poppins text-xs hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shrink-0 shadow-sm font-semibold rounded-xl px-5 h-11">
              <Plus className="w-4 h-4 mr-2" /> Post Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-bold">Post an Opportunity</DialogTitle>
              <DialogDescription>
                Found a great opportunity? Share it with students in your department.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job or Opportunity Title</Label>
                <Input id="title" placeholder="e.g. Software Engineering Intern" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company / Organization</Label>
                <Input id="company" placeholder="e.g. Google, MTN, Federal Govt" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                      <SelectItem value="HACKATHON">Hackathon</SelectItem>
                      <SelectItem value="JOB">Job</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Application Link (URL)</Label>
                <Input id="url" type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
              <Button 
                onClick={() => createOpportunity.mutate()} 
                disabled={!title || !company || !url || createOpportunity.isPending}
                className="bg-black hover:bg-black/90 text-white rounded-xl dark:bg-white dark:text-black"
              >
                {createOpportunity.isPending ? "Posting..." : "Post Opportunity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : !opportunities || opportunities.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 shadow-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-2 font-open-sans">No Opportunities Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto font-poppins">
            Wait for admins or fellow students to post internships and scholarships for your department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="flex flex-col h-full hover:shadow-lg transition-all border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <CardHeader className="pb-3 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl  border border-gray-100 dark:border-zinc-800 shadow-sm">
                    {getIcon(opp.type)}
                  </div>
                  <Badge variant="secondary" className={`${getBadgeColor(opp.type)} font-poppins border-0 font-medium px-2.5 py-0.5 rounded-full`}>
                    {opp.type}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2 font-open-sans text-foreground leading-tight">
                  {opp.title}
                </CardTitle>
                <CardDescription className="font-semibold font-open-sans text-slate-700 dark:text-slate-300 mt-1 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> {opp.company}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="py-2 text-sm text-muted-foreground font-poppins space-y-2">
                {opp.deadline && (
                  <div className="flex items-center gap-2 ">
                    <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Closes {format(new Date(opp.deadline), "MMM d, yyyy")}</span>
                  </div>
                )}
                <div className="text-xs font-poppins">
                  Posted {formatDistanceToNow(new Date(opp.createdAt))} ago
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 pb-5 border-t border-gray-100 dark:border-zinc-800 mt-auto bg-gray-50/30 dark:bg-zinc-900/10">
                <a href={opp.url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full bg-white dark:bg-zinc-900 hover:bg-slate-50 border-gray-200 dark:border-zinc-700 font-semibold hover:text-black dark:hover:text-white transition-all shadow-sm group">
                    View Details <ExternalLink className="w-3.5 h-3.5 ml-2 text-muted-foreground group-hover:text-black dark:group-hover:text-white" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
