import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Calendar, ExternalLink, Building2, Globe, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Opportunity } from "./types";
import { getIcon, getBadgeColor, getDeadlineUrgency } from "./utils";

interface OpportunityCardProps {
  opportunity: Opportunity;
  canManage: boolean;
  onEdit: (opp: Opportunity) => void;
  onDelete: (opp: Opportunity) => void;
}

export function OpportunityCard({ opportunity: opp, canManage, onEdit, onDelete }: OpportunityCardProps) {
  const urgency = getDeadlineUrgency(opp.deadline);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
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
            {urgency && (
              <Badge
                variant="secondary"
                className={`${urgency.className} font-poppins border-0 font-medium px-2.5 py-0.5 rounded-full`}
              >
                {urgency.label}
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

        {canManage && (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(opp)}
              className="flex-1 border-gray-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all rounded-xl text-xs font-semibold"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(opp)}
              className="flex-1 border-gray-200 dark:border-zinc-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all rounded-xl text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
