// hooks/useBooks.ts
import { useQuery } from "@tanstack/react-query";

type BookFilters = {
  departmentId?: string;
  type?: string;
  level?: string;
  courseId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
};

// Background jobs (PDF parsing, AI question generation) update a book's
// parseStatus asynchronously via a worker queue - these are the non-terminal
// states where we should keep polling until the job finishes.
const NON_TERMINAL_PARSE_STATUSES = new Set([
  "pending",
  "parsing",
  "generating_questions",
  "processing",
]);

export const useBooks = (filters: BookFilters) => {
  const {
    departmentId,
    type,
    level,
    courseId,
    page = 1,
    pageSize = 5,
    search,
  } = filters;

  return useQuery({
    queryKey: ["books", filters], // include all filters in the key for caching
    queryFn: async () => {
      const params = new URLSearchParams();

      if (departmentId) params.set("departmentId", departmentId);
      if (type) params.set("type", type === "All" ? "" : type);
      if (level) params.set("level", level);
      if (courseId) params.set("courseId", courseId);
      if (search && search.trim().length >= 2) params.set("search", search.trim());
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      const response = await fetch(`/api/books?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch books");

      return response.json();
    },
    enabled: !!departmentId, // Only fetch when departmentId is available
    staleTime: 5 * 60 * 1000,
    // Poll every 5s only while a book on this page is still being processed
    // in the background; otherwise don't poll at all.
    refetchInterval: (query) => {
      const data = query.state.data as { books?: { parseStatus?: string | null }[] } | undefined;
      const hasPendingJob = data?.books?.some(
        (b) => b.parseStatus && NON_TERMINAL_PARSE_STATUSES.has(b.parseStatus)
      );
      return hasPendingJob ? 5000 : false;
    },
  });
};

export const useMyBooks = () => {
  return useQuery({
    queryKey: ["mybooks"],
    queryFn: async () => {
      const url = `/api/users/book-count`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch books");
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minutes
    // cacheTime: 30 * 60 * 1000,
  });
};
export const useBook = (bookId: string) => {
  return useQuery<any>({
    queryKey: ["books", bookId],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}`);
      return res.json();
    },
    enabled: !!bookId,
    staleTime: 1000 * 60 * 5, // 5 minutes (data is fresh for 5 mins)
    // cacheTime: 1000 * 60 * 30,
  });
};

export const useBookPages = (bookId: string) => {
  return useQuery({
    queryKey: ["bookPages", bookId],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}/pages`);
      if (!res.ok) throw new Error("Failed to fetch book pages");
      const data = await res.json();
      return data.pages;
    },
    staleTime: 1000 * 60 * 5, // cache 5 minutes
  });
};
