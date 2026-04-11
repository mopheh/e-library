// FacultyRow.tsx
"use client";
import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
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
      <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 mb-3 bg-white dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl transition-all duration-300 hover:shadow-md hover:border-blue-500/30 dark:hover:border-blue-500/30">
        
        {/* Name Block */}
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold font-cairo border border-zinc-200 dark:border-zinc-700/50 shadow-inner">
            {name.charAt(0).toUpperCase()}
          </div>
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm font-poppins">{name}</h4>
        </div>

        {/* Info & Actions Block */}
        <div className="flex items-center sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto mt-2 sm:mt-0 pt-2 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col items-end">
             <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 font-poppins bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
               {isLoading ? "..." : isError ? "-" : `${users?.length ?? 0} Students`}
             </span>
          </div>
          
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {/* Render avatars for assigned reps */}
            {reps.length > 0 && (
              <div className="flex -space-x-2">
                 <TooltipProvider>
                    {reps.map((rep: any, idx: number) => (
                      <Tooltip key={rep.id}>
                        <TooltipTrigger asChild>
                           <div 
                             className="h-8 w-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold text-[10px] border-2 border-white dark:border-zinc-900 shadow-sm cursor-help hover:z-10 transition-transform hover:scale-110 overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                             style={{ zIndex: reps.length - idx }}
                           >
                             {rep.imageUrl ? (
                               <img src={rep.imageUrl} alt={rep.fullName} className="h-full w-full object-cover" />
                             ) : (
                               rep.fullName?.charAt(0).toUpperCase() || "R"
                             )}
                           </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 border-zinc-800">
                           <p className="font-medium text-xs font-poppins text-white">{rep.fullName}</p>
                           <p className="text-[10px] text-zinc-400 font-poppins">{rep.email}</p>
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
                  className="h-8 pl-2 pr-3 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 sm:relative sm:right-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-poppins text-zinc-700 dark:text-zinc-200 shadow-sm"
                  onClick={() => setOpenRepModal(true)}
              >
                  <UserPlus className="h-3.5 w-3.5" />
                  Assign Rep
              </Button>
            )}
          </div>
        </div>
      </div>

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
