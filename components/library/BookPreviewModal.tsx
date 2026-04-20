import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils";
import { BookOpen, Download, User, Calendar } from "lucide-react";
import { Book } from "@/types";

interface BookPreviewModalProps {
  book?: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReader: (id: string) => void;
}

export const BookPreviewModal = ({ book, isOpen, onClose, onOpenReader }: BookPreviewModalProps) => {
  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 gap-0">
        
        <div className="h-32 bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-900 dark:to-blue-800 flex items-end px-6 pb-6 relative">
           <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
             {book.type}
           </div>
        </div>

        <div className="px-6 pb-6 pt-4 relative">
           <div className="absolute -top-12 left-6 h-20 w-16 bg-white dark:bg-zinc-900 border-2 border-white dark:border-zinc-950 shadow-md rounded-md flex items-center justify-center overflow-hidden">
              <BookOpen className="w-8 h-8 text-zinc-300" />
           </div>

           <div className="mt-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-josefin-sans leading-tight">
                  {book.title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                  {book.description || "No description was provided by the uploader. This resource is categorized under its specific course code."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Course / Dept</span>
                    <span className="text-sm font-medium">{book.course || book.department?.name || "General"}</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">File Size</span>
                    <span className="text-sm font-medium font-mono">{book.fileSize ? formatBytes(book.fileSize) : "PDF"}</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Uploaded By</span>
                    <span className="text-sm font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> UniVault User</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date Added</span>
                    <span className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(book.createdAt).toLocaleDateString()}</span>
                 </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                 <button 
                  onClick={() => onOpenReader(book.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                    <BookOpen className="w-4 h-4" /> Open Reader
                 </button>
                 <button className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800">
                    <Download className="w-4 h-4" /> Download
                 </button>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
