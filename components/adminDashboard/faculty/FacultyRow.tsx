// FacultyRow.tsx
"use client";
import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AddRepModal from "./AddRepModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FacultyRow = ({
  facultyId,
  name,
}: {
  facultyId: string;
  name: string;
}) => {
  const { data: users, isLoading, isError } = useUsers(facultyId);
  const [openRepModal, setOpenRepModal] = useState(false);

  // Filter out the existing reps
  const reps = (users || []).filter((u: any) => u.role === "FACULTY REP" || u.role === "faculty-rep");
  const maxRepsReached = reps.length >= 2;

  return (
    <>
      <TableRow className="group cursor-default hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
        <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 py-3 font-cabin">{name}</TableCell>
        <TableCell className="text-right text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center justify-end gap-4">
            <span className="text-xs mr-2 font-poppins">{isLoading ? "..." : isError ? "-" : `${users?.length ?? 0} Students`}</span>
            
            {/* Render avatars for assigned reps */}
            {reps.length > 0 && (
              <div className="flex -space-x-2 mr-2">
                 <TooltipProvider>
                    {reps.map((rep: any, idx: number) => (
                      <Tooltip key={rep.id}>
                        <TooltipTrigger asChild>
                           <div 
                             className="h-8 w-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold text-xs border-2 border-white dark:border-zinc-950 shadow-sm cursor-help hover:z-10 transition-transform hover:scale-110 overflow-hidden"
                             style={{ zIndex: reps.length - idx }}
                           >
                             {rep.imageUrl ? (
                               <img src={rep.imageUrl} alt={rep.fullName} className="h-full w-full object-cover" />
                             ) : (
                               rep.fullName?.charAt(0).toUpperCase() || "R"
                             )}
                           </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p className="font-medium text-xs font-poppins">{rep.fullName}</p>
                           <p className="text-[10px] text-zinc-500 font-poppins">{rep.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                 </TooltipProvider>
              </div>
            )}

            {!maxRepsReached && (
              <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 hidden group-hover:flex text-xs font-poppins"
                  onClick={() => setOpenRepModal(true)}
              >
                  <UserPlus className="h-3.5 w-3.5" />
                  Assign Rep
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <AddRepModal
        open={openRepModal}
        onCancel={() => setOpenRepModal(false)}
        facultyId={facultyId}
        facultyName={name}
      />
    </>
  );
};

export default FacultyRow;
