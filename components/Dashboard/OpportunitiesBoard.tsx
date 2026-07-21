"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Briefcase, ExternalLink, Calendar, Loader2,
  Award, TerminalSquare, Building2, Globe, Pencil, Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserData } from "@/hooks/useUsers";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  url: string;
  type: string;
  deadline: string | null;
  createdAt: string;
  departmentId: string | null;
}

/* ─── helpers ─────────────────────────────────────── */
const getIcon = (opType: string) => {
  switch (opType) {
    case "INTERNSHIP":  return <Briefcase      className="w-5 h-5 text-blue-500" />;
    case "SCHOLARSHIP": return <Award          className="w-5 h-5 text-amber-500" />;
    case "HACKATHON":   return <TerminalSquare className="w-5 h-5 text-purple-500" />;
    case "JOB":         return <Building2      className="w-5 h-5 text-emerald-500" />;
    default:            return <Globe          className="w-5 h-5 text-gray-500" />;
  }
};

const getBadgeColor = (opType: string) => {
  switch (opType) {
    case "INTERNSHIP":  return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "SCHOLARSHIP": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "HACKATHON":   return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
    case "JOB":         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    default:            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

/** Convert ISO timestamp → YYYY-MM-DD for input[type=date] */
const toDateInput = (iso: string | null) =>
  iso ? iso.slice(0, 10) : "";

/* ─── shared form fields component ───────────────── */
interface OppFormFieldsProps {
  title: string; setTitle: (v: string) => void;
  company: string; setCompany: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  type: string; setType: (v: string) => void;
  deadline: string; setDeadline: (v: string) => void;
  isGlobal: boolean; setIsGlobal: (v: boolean) => void;
  isAdmin: boolean;
}

const OppFormFields = ({
  title, setTitle, company, setCompany, url, setUrl,
  type, setType, deadline, setDeadline, isGlobal, setIsGlobal, isAdmin,
}: OppFormFieldsProps) => (
  <div className="space-y-4 py-4">
    <div className="space-y-2">
      <Label htmlFor="opp-title">Job or Opportunity Title</Label>
      <Input
        id="opp-title"
        placeholder="e.g. Software Engineering Intern"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="opp-company">Company / Organization</Label>
      <Input
        id="opp-company"
        placeholder="e.g. Google, MTN, Federal Govt"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
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
        <Label htmlFor="opp-deadline">Deadline (Optional)</Label>
        <Input
          id="opp-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="opp-url">Application Link (URL)</Label>
      <Input
        id="opp-url"
        type="url"
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
    </div>
    {isAdmin && (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-4 py-3">
        <Checkbox
          id="opp-isGlobal"
          checked={isGlobal}
          onCheckedChange={(checked) => setIsGlobal(checked === true)}
          className="mt-0.5 border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
        />
        <div className="space-y-0.5">
          <Label
            htmlFor="opp-isGlobal"
            className="text-sm font-semibold text-amber-800 dark:text-amber-300 cursor-pointer"
          >
            Post for All Faculties
          </Label>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Visible to every student regardless of department.
          </p>
        </div>
      </div>
    )}
  </div>
);

/* ─── main component ──────────────────────────────── */
export const OpportunitiesBoard = () => {
  const queryClient = useQueryClient();
  const { data: userData } = useUserData();
  const isAdmin = userData?.role === "ADMIN";

  // ── filters
  const [filter, setFilter] = useState("ALL");

  // ── create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cCompany, setCCompany] = useState("");
  const [cUrl, setCUrl] = useState("");
  const [cType, setCType] = useState("INTERNSHIP");
  const [cDeadline, setCDeadline] = useState("");
  const [cGlobal, setCGlobal] = useState(false);

  // ── edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Opportunity | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eCompany, setECompany] = useState("");
  const [eUrl, setEUrl] = useState("");
  const [eType, setEType] = useState("INTERNSHIP");
  const [eDeadline, setEDeadline] = useState("");
  const [eGlobal, setEGlobal] = useState(false);

  // ── delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null);

  /* ── queries ── */
  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["opportunities", filter],
    queryFn: async () => {
      const qs = filter !== "ALL" ? `?type=${filter}` : "";
      const res = await fetch(`/api/opportunities${qs}`);
      if (!res.ok) throw new Error("Failed to load opportunities");
      return res.json();
    },
  });

  /* ── create ── */
  const createOpportunity = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cTitle, company: cCompany, url: cUrl,
          type: cType, deadline: cDeadline || null,
          isGlobal: isAdmin && cGlobal,
        }),
      });
      if (!res.ok) throw new Error("Failed to post opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setCreateOpen(false);
      setCTitle(""); setCCompany(""); setCUrl("");
      setCType("INTERNSHIP"); setCDeadline(""); setCGlobal(false);
      toast.success("Opportunity posted successfully");
    },
    onError: () => toast.error("Failed to post opportunity"),
  });

  /* ── edit ── */
  const openEdit = (opp: Opportunity) => {
    setEditTarget(opp);
    setETitle(opp.title);
    setECompany(opp.company);
    setEUrl(opp.url);
    setEType(opp.type);
    setEDeadline(toDateInput(opp.deadline));
    setEGlobal(opp.departmentId === null);
    setEditOpen(true);
  };

  const editOpportunity = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/opportunities/${editTarget!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eTitle, company: eCompany, url: eUrl,
          type: eType, deadline: eDeadline || null,
          isGlobal: eGlobal,
        }),
      });
      if (!res.ok) throw new Error("Failed to update opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setEditOpen(false);
      setEditTarget(null);
      toast.success("Opportunity updated");
    },
    onError: () => toast.error("Failed to update opportunity"),
  });

  /* ── delete ── */
  const openDelete = (opp: Opportunity) => {
    setDeleteTarget(opp);
    setDeleteOpen(true);
  };

  const deleteOpportunity = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/opportunities/${deleteTarget!.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setDeleteOpen(false);
      setDeleteTarget(null);
      toast.success("Opportunity deleted");
    },
    onError: () => toast.error("Failed to delete opportunity"),
  });

  /* ── render ── */
  return (
    <div className="space-y-6">

      {/* ── top bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="bg-white font-poppins dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 h-11 p-1">
            <TabsTrigger value="ALL"        className="rounded-md text-xs">All</TabsTrigger>
            <TabsTrigger value="INTERNSHIP" className="rounded-md shrink-0 text-xs">Internships</TabsTrigger>
            <TabsTrigger value="SCHOLARSHIP" className="rounded-md shrink-0 text-xs">Scholarships</TabsTrigger>
            <TabsTrigger value="HACKATHON"  className="rounded-md shrink-0 text-xs">Hackathons</TabsTrigger>
            <TabsTrigger value="JOB"        className="rounded-md shrink-0 text-xs">Jobs</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── create dialog ── */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-poppins text-xs hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shrink-0 shadow-sm font-semibold rounded-xl px-5 h-11">
              <Plus className="w-4 h-4 mr-2" /> Post Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-bold">Post an Opportunity</DialogTitle>
              <DialogDescription>
                {isAdmin && cGlobal
                  ? "This opportunity will be visible to all students across every faculty."
                  : "Found a great opportunity? Share it with students in your department."}
              </DialogDescription>
            </DialogHeader>
            <OppFormFields
              title={cTitle} setTitle={setCTitle}
              company={cCompany} setCompany={setCCompany}
              url={cUrl} setUrl={setCUrl}
              type={cType} setType={setCType}
              deadline={cDeadline} setDeadline={setCDeadline}
              isGlobal={cGlobal} setIsGlobal={setCGlobal}
              isAdmin={isAdmin}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => createOpportunity.mutate()}
                disabled={!cTitle || !cCompany || !cUrl || createOpportunity.isPending}
                className="bg-black hover:bg-black/90 text-white rounded-xl dark:bg-white dark:text-black"
              >
                {createOpportunity.isPending ? "Posting…" : "Post Opportunity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── edit dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-bold">Edit Opportunity</DialogTitle>
            <DialogDescription>
              Update the details below — changes are visible immediately.
            </DialogDescription>
          </DialogHeader>
          <OppFormFields
            title={eTitle} setTitle={setETitle}
            company={eCompany} setCompany={setECompany}
            url={eUrl} setUrl={setEUrl}
            type={eType} setType={setEType}
            deadline={eDeadline} setDeadline={setEDeadline}
            isGlobal={eGlobal} setIsGlobal={setEGlobal}
            isAdmin={isAdmin}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => editOpportunity.mutate()}
              disabled={!eTitle || !eCompany || !eUrl || editOpportunity.isPending}
              className="bg-black hover:bg-black/90 text-white rounded-xl dark:bg-white dark:text-black"
            >
              {editOpportunity.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── delete confirm dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-bold text-red-600 dark:text-red-400">
              Delete Opportunity
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{deleteTarget?.title}&rdquo;
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteOpportunity.mutate()}
              disabled={deleteOpportunity.isPending}
              className="rounded-xl"
            >
              {deleteOpportunity.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Delete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── list ── */}
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
            <Card
              key={opp.id}
              className="flex flex-col h-full hover:shadow-lg transition-all border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
            >
              <CardHeader className="pb-3 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    {getIcon(opp.type)}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge
                      variant="secondary"
                      className={`${getBadgeColor(opp.type)} font-poppins border-0 font-medium px-2.5 py-0.5 rounded-full`}
                    >
                      {opp.type}
                    </Badge>
                    {!opp.departmentId && (
                      <Badge
                        variant="secondary"
                        className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-poppins border-0 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" /> All Faculties
                      </Badge>
                    )}
                  </div>
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
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Closes {format(new Date(opp.deadline), "MMM d, yyyy")}</span>
                  </div>
                )}
                <div className="text-xs font-poppins">
                  Posted {formatDistanceToNow(new Date(opp.createdAt))} ago
                </div>
              </CardContent>

              <CardFooter className="pt-4 pb-5 border-t border-gray-100 dark:border-zinc-800 mt-auto bg-gray-50/30 dark:bg-zinc-900/10 flex flex-col gap-2">
                <a href={opp.url} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full bg-white dark:bg-zinc-900 hover:bg-slate-50 border-gray-200 dark:border-zinc-700 font-semibold hover:text-black dark:hover:text-white transition-all shadow-sm group"
                  >
                    View Details <ExternalLink className="w-3.5 h-3.5 ml-2 text-muted-foreground group-hover:text-black dark:group-hover:text-white" />
                  </Button>
                </a>

                {/* Admin action row */}
                {isAdmin && (
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(opp)}
                      className="flex-1 border-gray-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all rounded-xl text-xs font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDelete(opp)}
                      className="flex-1 border-gray-200 dark:border-zinc-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all rounded-xl text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
