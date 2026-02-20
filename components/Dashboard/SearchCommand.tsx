"use client";

import React, { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";
import { BookOpen, FileText, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

// Define strict types for search results
interface SearchResult {
  books: {
    id: string;
    title: string;
    type: string;
    description: string;
    fileUrl: string | null;
  }[];
  courses: {
    id: string;
    title: string;
    code: string;
  }[];
}

interface SearchCommandProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SearchCommand({ open, setOpen }: SearchCommandProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search books, courses, or notes..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
            {loading ? (
                <div className="flex items-center justify-center py-6 text-xs font-poppins text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                </div>
            ) : (
                "No results found."
            )}
        </CommandEmpty>
         
        {/* Suggestion / Default State can go here if query is empty */}
        
        {!loading && results && (
            <>
                {results.books.length > 0 && (
                    <CommandGroup heading="Books">
                        {results.books.map((book) => (
                            <CommandItem 
                                key={book.id} 
                                value={`book-${book.title}`} // unique value for accessibility
                                onSelect={() => handleSelect(() => router.push(`/student/books/${book.id}`))}
                            >
                                <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span>{book.title}</span>
                                    <span className="text-xs font-poppins text-muted-foreground truncate max-w-[300px]">{book.description}</span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
                
                {results.books.length > 0 && results.courses.length > 0 && <CommandSeparator />}

                {results.courses.length > 0 && (
                    <CommandGroup heading="Courses">
                         {results.courses.map((course) => (
                            <CommandItem 
                                key={course.id} 
                                value={`course-${course.title}`}
                                onSelect={() => handleSelect(() => router.push(`/student/courses`))}
                            >
                                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{course.code} - {course.title}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
