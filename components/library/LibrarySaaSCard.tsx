import React, { useState } from "react";
import { formatBytes } from "@/lib/utils";
import { BookOpen, Eye, Download, Star, Bookmark } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Book } from "@/types";
import Image from "next/image";

const getTypeColor = (type?: string) => {
  switch (type?.toLowerCase()) {
    case 'text book':
      return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40';
    case 'handout':
      return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40';
    case 'past question':
      return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40';
    case 'material':
      return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40';
    default:
      return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40';
  }
};

export const LibrarySaaSCard = ({ book, onPreview }: { book: Book, onPreview: (book: Book) => void }) => {
  const [saved, setSaved] = useState(false);

  // Fake metrics
  const fakeReads = book.readCount || Math.floor(Math.random() * 500) + 50;
  const fakeDownloads = Math.floor(fakeReads * 0.4);
  const fakeRating = (4 + Math.random()).toFixed(1);

  return (
    <div 
       className="group relative flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 w-full"
    >
      <div className="flex justify-between items-start mb-3">
        <div 
          onClick={() => onPreview(book)}
          className="flex h-12 w-10 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0 cursor-pointer overflow-hidden relative"
        >
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt="Cover" fill className="object-cover" />
          ) : (
            <BookOpen className="h-5 w-5 text-zinc-400" />
          )}
        </div>
        <div className="flex gap-2">
           <Badge variant="secondary" className={`text-[10px] font-normal font-poppins tracking-wide border-none px-2 py-0 rounded-full h-5 ${getTypeColor(book.type)}`}>
             {book.type}
           </Badge>
           <TooltipProvider delayDuration={0}>
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
                  className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${saved ? 'text-blue-600' : 'text-zinc-400'}`}
                 >
                   <Bookmark className="w-4 h-4" strokeWidth={saved ? 3 : 2} fill={saved ? "currentColor" : "none"} />
                 </button>
               </TooltipTrigger>
               <TooltipContent>
                 <p className="font-poppins text-xs">{saved ? 'Remove from Saved' : 'Save for later'}</p>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 cursor-pointer" onClick={() => onPreview(book)}>
        <h3 className="text-base font-semibold font-cabin leading-tight text-zinc-900 dark:text-white line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        <p className="text-[11px] font-normal font-poppins text-zinc-500 line-clamp-1 mb-2 uppercase tracking-wider">
           {book.course || book.department?.name || "General Resource"}
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {book.description || "No description provided. Click to view more details about this academic resource."}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-poppins text-zinc-500 dark:text-zinc-400">
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Reads">
               <Eye className="w-3.5 h-3.5" />
               <span className="font-medium text-zinc-700 dark:text-zinc-300">{fakeReads}</span>
            </div>
            <div className="flex items-center gap-1" title="Downloads">
               <Download className="w-3 h-3" />
               <span>{fakeDownloads}</span>
            </div>
            <div className="flex items-center gap-1 text-orange-500" title="Rating">
               <Star className="w-3 h-3 fill-current" />
               <span className="font-semibold">{fakeRating}</span>
            </div>
         </div>
         {book.fileSize && (
           <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-[10px]">
             {formatBytes(book.fileSize)}
           </span>
         )}
      </div>
    </div>
  );
};
