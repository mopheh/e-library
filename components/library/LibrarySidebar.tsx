import React from "react";
import { Filter, Layers, BookOpen, LibraryBig } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const LibrarySidebar = ({
  department,
  setDepartment,
  level,
  setLevel,
  type,
  setType,
  departments
}: {
  department?: string;
  setDepartment: (val: string) => void;
  level?: string;
  setLevel: (val: string) => void;
  type: string;
  setType: (val: string) => void;
  departments: any[];
}) => {
  return (
    <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
      <div className="sticky top-24 space-y-6">
        
        {/* Filters Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-2 px-1">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
               <Filter className="w-4 h-4 text-blue-600" />
               <h3 className="font-normal font-poppins">Refine</h3>
            </div>
            {(department || level || type !== "All") && (
               <button 
                  onClick={() => { setDepartment(""); setLevel(""); setType("All"); }}
                  className="text-xs cursor-pointer font-medium font-poppins text-zinc-500 hover:text-red-500 transition-colors"
               >
                  Reset
               </button>
            )}
          </div>

          <Accordion type="multiple" defaultValue={["department", "level", "type"]} className="w-full">
            {/* Department */}
            <AccordionItem value="department" className="border-none">
              <AccordionTrigger className="py-3 hover:no-underline px-1">
                 <div className="flex items-center gap-2 text-xs font-normal font-poppins text-zinc-700 dark:text-zinc-300">
                    <LibraryBig className="w-4 h-4 text-zinc-400" /> Department
                 </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-4">
                 <div className="space-y-1.5 flex flex-col">
                    <button
                       onClick={() => setDepartment("")}
                       className={cn("text-left px-2 py-1.5 rounded-lg text-xs font-normal font-poppins transition-colors", !department ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50")}
                    >
                       All Departments
                    </button>
                    {departments?.map((dept) => (
                       <button
                          key={dept.id}
                          onClick={() => setDepartment(dept.id)}
                          className={cn("text-left px-2 py-1.5 rounded-lg text-xs font-normal font-poppins transition-colors", department === dept.id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50")}
                       >
                          {dept.name}
                       </button>
                    ))}
                 </div>
              </AccordionContent>
            </AccordionItem>

            {/* Level */}
            <AccordionItem value="level" className="border-t border-zinc-100 dark:border-zinc-800">
              <AccordionTrigger className="py-3 hover:no-underline px-1">
                 <div className="flex items-center gap-2 text-xs font-normal font-poppins text-zinc-700 dark:text-zinc-300">
                    <Layers className="w-4 h-4 text-zinc-400" /> Level
                 </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-4">
                 <div className="grid grid-cols-2 gap-2">
                    {[100, 200, 300, 400, 500, 600].map((lvl) => (
                       <button
                          key={lvl}
                          onClick={() => setLevel(String(lvl))}
                          className={cn("py-2 px-3 rounded-xl border text-xs font-normal font-poppins transition-all", level === String(lvl) ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700")}
                       >
                          {lvl}L
                       </button>
                    ))}
                 </div>
              </AccordionContent>
            </AccordionItem>

            {/* Type */}
            <AccordionItem value="type" className="border-t border-zinc-100 dark:border-zinc-800">
              <AccordionTrigger className="py-3 hover:no-underline px-1">
                 <div className="flex items-center gap-2 text-xs font-normal font-poppins text-zinc-700 dark:text-zinc-300">
                    <BookOpen className="w-4 h-4 text-zinc-400" /> Resource Type
                 </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-4">
                 <div className="flex flex-col space-y-1.5">
                    {["All", "Text Book", "Handout", "Past Question", "Material"].map((t) => (
                       <label key={t} className="flex items-center gap-3 group font-poppins cursor-pointer py-1">
                          <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors", type === t ? "border-blue-600 bg-blue-600" : "border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500")}>
                             {type === t && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className={cn("text-xs transition-colors", type === t ? "text-zinc-900 dark:text-white font-normal" : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 font-light dark:group-hover:text-white")}>{t === "All" ? "Any Type" : t}</span>
                          <input type="radio" className="hidden" checked={type === t} onChange={() => setType(t)} />
                       </label>
                    ))}
                 </div>
              </AccordionContent>
            </AccordionItem>
            
          </Accordion>
        </div>
      </div>
    </div>
  );
};
