import React from "react";
import { Search, Flame, Clock, BookMarked, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SmartLibraryHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFilterClick: (filterType: string) => void;
}

export const SmartLibraryHeader = ({ searchQuery, setSearchQuery, onFilterClick }: SmartLibraryHeaderProps) => {
  return (
    <div className="w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 pb-8 pt-10 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          
          <div className="flex-1 max-w-2xl">
            {/* <h1 className="text-4xl font-extrabold font-josefin-sans tracking-tight text-zinc-900 dark:text-white mb-2">
              Library
            </h1> */}
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-cabin mb-6 leading-tight">
              Explore curated academic resources strictly tailored to your department and courses.
            </p>
            
            <div className="relative group max-w-xl">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Search title, course code, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 font-poppins placeholder:font-manrope h-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm shadow-xs focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500 transition-all font-normal"
              />
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end shrink-0 mb-2">
            <span className="text-xs font-poppins font-normal uppercase tracking-wider text-zinc-400 mb-3">Quick Filters</span>
            <div className="flex flex-wrap gap-2 justify-end max-w-sm font-poppins">
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors px-3 py-1.5 flex items-center gap-1.5 text-xs font-light"
                onClick={() => onFilterClick("My Department")}
              >
                <Layers className="w-3.5 h-3.5" /> My Department
              </Badge>
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 dark:bg-zinc-900 transition-colors px-3 py-1.5 flex items-center gap-1.5 text-xs font-light"
                onClick={() => onFilterClick("Trending")}
              >
                <Flame className="w-3.5 h-3.5" /> Trending
              </Badge>
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 dark:bg-zinc-900 transition-colors px-3 py-1.5 flex items-center gap-1.5 text-xs font-light"
                onClick={() => onFilterClick("Recently Added")}
              >
                <Clock className="w-3.5 h-3.5" /> Recently Added
              </Badge>
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors px-3 py-1.5 flex items-center gap-1.5 text-xs font-light"
                onClick={() => onFilterClick("Saved")}
              >
                <BookMarked className="w-3.5 h-3.5" /> Saved
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
