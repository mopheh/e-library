import React from "react";
import { Plus, Search, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OpportunitiesToolbarProps {
  filter: string;
  onFilterChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  canPost: boolean;
  onPostClick: () => void;
}

export function OpportunitiesToolbar({
  filter, onFilterChange, search, onSearchChange, canPost, onPostClick,
}: OpportunitiesToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs value={filter} onValueChange={onFilterChange} className="w-full sm:w-auto">
          <TabsList className="bg-white font-poppins dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 h-11 p-1">
            <TabsTrigger value="ALL" className="rounded-md text-xs">All</TabsTrigger>
            <TabsTrigger value="INTERNSHIP" className="rounded-md shrink-0 text-xs">Internships</TabsTrigger>
            <TabsTrigger value="SCHOLARSHIP" className="rounded-md shrink-0 text-xs">Scholarships</TabsTrigger>
            <TabsTrigger value="HACKATHON" className="rounded-md shrink-0 text-xs">Hackathons</TabsTrigger>
            <TabsTrigger value="JOB" className="rounded-md shrink-0 text-xs">Jobs</TabsTrigger>
          </TabsList>
        </Tabs>

        {canPost && (
          <Button
            onClick={onPostClick}
            className="bg-black text-white font-poppins text-xs hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shrink-0 shadow-sm font-semibold rounded-xl px-5 h-11"
          >
            <Plus className="w-4 h-4 mr-2" /> Post Opportunity
          </Button>
        )}
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or company…"
          className="pl-9 pr-8 h-10 rounded-xl bg-white dark:bg-zinc-950 font-poppins text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
