"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/hooks/useUsers";
import { Opportunity, OpportunityFormValues } from "./opportunities/types";
import { getDeadlineUrgency } from "./opportunities/utils";
import { OpportunitiesToolbar } from "./opportunities/OpportunitiesToolbar";
import { OpportunityCard } from "./opportunities/OpportunityCard";
import { OpportunityCardSkeleton } from "./opportunities/OpportunityCardSkeleton";
import { OpportunityFormDialog } from "./opportunities/OpportunityFormDialog";
import { DeleteOpportunityDialog } from "./opportunities/DeleteOpportunityDialog";

const StatTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 rounded-2xl px-5 py-4 border border-gray-200 dark:border-zinc-800 shadow-sm">
    <div className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black font-cabin text-foreground leading-none">{value}</p>
      <p className="text-[11px] font-poppins text-muted-foreground mt-1">{label}</p>
    </div>
  </div>
);

export const OpportunitiesBoard = () => {
  const queryClient = useQueryClient();
  const { data: userData } = useUserData();
  const isAdmin = userData?.role === "ADMIN";
  // Posting is server-gated to ADMIN and FACULTY REP (see POST /api/opportunities) -
  // the button must match that or non-privileged users hit a confusing 403.
  const canPost = userData?.role === "ADMIN" || userData?.role === "FACULTY REP";
  // Editing/deleting is server-gated to ADMIN only (see PATCH/DELETE /api/opportunities/:id).
  const canManage = isAdmin;

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Opportunity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null);

  /* ── query ── */
  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["opportunities", filter],
    queryFn: async () => {
      const qs = filter !== "ALL" ? `?type=${filter}` : "";
      const res = await fetch(`/api/opportunities${qs}`);
      if (!res.ok) throw new Error("Failed to load opportunities");
      return res.json();
    },
  });

  /* ── derived: search + urgency-first sort ── */
  const visibleOpportunities = useMemo(() => {
    const list = opportunities ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter((o) => o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q))
      : list;

    // Soonest-closing first; no-deadline / already-closed opportunities sink
    // to the bottom (in their existing createdAt-desc order from the API).
    return [...filtered].sort((a, b) => {
      const aUrgent = a.deadline && new Date(a.deadline).getTime() >= Date.now() - 86400000;
      const bUrgent = b.deadline && new Date(b.deadline).getTime() >= Date.now() - 86400000;
      if (aUrgent && bUrgent) return new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime();
      if (aUrgent) return -1;
      if (bUrgent) return 1;
      return 0;
    });
  }, [opportunities, search]);

  const closingSoonCount = useMemo(
    () => (opportunities ?? []).filter((o) => {
      const urgency = getDeadlineUrgency(o.deadline);
      return urgency && urgency.daysLeft >= 0;
    }).length,
    [opportunities],
  );

  /* ── mutations ── */
  const createOpportunity = useMutation({
    mutationFn: async (values: OpportunityFormValues) => {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, deadline: values.deadline || null, isGlobal: isAdmin && values.isGlobal }),
      });
      if (!res.ok) throw new Error("Failed to post opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setCreateOpen(false);
      toast.success("Opportunity posted successfully");
    },
    onError: () => toast.error("Failed to post opportunity"),
  });

  const editOpportunity = useMutation({
    mutationFn: async (values: OpportunityFormValues) => {
      const res = await fetch(`/api/opportunities/${editTarget!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, deadline: values.deadline || null }),
      });
      if (!res.ok) throw new Error("Failed to update opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setEditTarget(null);
      toast.success("Opportunity updated");
    },
    onError: () => toast.error("Failed to update opportunity"),
  });

  const deleteOpportunity = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/opportunities/${deleteTarget!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete opportunity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setDeleteTarget(null);
      toast.success("Opportunity deleted");
    },
    onError: () => toast.error("Failed to delete opportunity"),
  });

  const hasActiveSearch = search.trim().length > 0;

  return (
    <div className="space-y-6">
      {!isLoading && opportunities && opportunities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
          <StatTile icon={<ListChecks className="w-5 h-5 text-indigo-500" />} label={filter === "ALL" ? "Total opportunities" : "In this category"} value={opportunities.length} />
          <StatTile icon={<Clock className="w-5 h-5 text-amber-500" />} label="Closing within 7 days" value={closingSoonCount} />
        </div>
      )}

      <OpportunitiesToolbar
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
        canPost={canPost}
        onPostClick={() => setCreateOpen(true)}
      />

      <OpportunityFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        isAdmin={isAdmin}
        isSubmitting={createOpportunity.isPending}
        onSubmit={(values) => createOpportunity.mutate(values)}
      />

      <OpportunityFormDialog
        mode="edit"
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        initial={editTarget}
        isAdmin={isAdmin}
        isSubmitting={editOpportunity.isPending}
        onSubmit={(values) => editOpportunity.mutate(values)}
      />

      <DeleteOpportunityDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        target={deleteTarget}
        isDeleting={deleteOpportunity.isPending}
        onConfirm={() => deleteOpportunity.mutate()}
      />

      {/* ── list ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <OpportunityCardSkeleton key={i} />)}
        </div>
      ) : !opportunities || opportunities.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 shadow-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 flex items-center justify-center rounded-full mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-2 font-open-sans">No Opportunities Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto font-poppins">
            {canPost
              ? "Post an internship, scholarship, hackathon, or job for your department to get the board started."
              : "Wait for your faculty rep or admins to post internships and scholarships for your department."}
          </p>
        </div>
      ) : visibleOpportunities.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 shadow-sm">
          <h3 className="text-base font-medium text-foreground mb-2 font-open-sans">No matches for &ldquo;{search}&rdquo;</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto font-poppins">
            Try a different title or company name.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              canManage={canManage}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}
      {!isLoading && hasActiveSearch && visibleOpportunities.length > 0 && (
        <p className="text-xs text-muted-foreground font-poppins text-center">
          Showing {visibleOpportunities.length} of {opportunities?.length ?? 0} opportunities
        </p>
      )}
    </div>
  );
};
