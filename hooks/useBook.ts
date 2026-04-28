"use client";

import { useQuery } from "@tanstack/react-query";
import type { BookDetailDTO } from "@/types/api";

async function fetchBook(bookId: string): Promise<BookDetailDTO> {
  const response = await fetch(`/api/books/${bookId}`);

  if (response.status === 404) {
    throw new Error("Book not found");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch book");
  }

  return response.json();
}

export function useBook(bookId?: string) {
  return useQuery({
    queryKey: ["book", bookId],
    queryFn: () => fetchBook(bookId as string),
    enabled: Boolean(bookId),
  });
}
