import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

interface BooksResponse {
  books: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useBooks(page: number, search: string, category: string) {
  return useQuery<BooksResponse>({
    queryKey: ["books", { page, search, category }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      return fetcher(`/api/books?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });
}