"use client";

import { useQuery } from "@tanstack/react-query";
import type { BookListItem } from "@/types/api";

export type UseBooksParams = {
  search?: string;
  category?: string;
  page: number;
  limit: number;
};

export type BooksResponse = {
  books: BookListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

async function fetchBooks({ search, category, page, limit }: UseBooksParams): Promise<BooksResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const response = await fetch(`/api/books?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }

  return response.json();
}

export function useBooks(params: UseBooksParams) {
  return useQuery({
    queryKey: ["books", params],
    queryFn: () => fetchBooks(params),
  });
}
