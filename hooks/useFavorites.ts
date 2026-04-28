"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { BooksResponse } from "@/hooks/useBooks";
import type { BookDetailDTO, BookListItem, FavoriteItem } from "@/types/api";

type ToggleFavoriteInput = {
  bookId: number;
  isFavorited: boolean;
};

type ToggleFavoriteContext = {
  previousFavorites?: FavoriteItem[];
  previousBooks: Array<[QueryKey, BooksResponse | undefined]>;
  previousBook?: BookDetailDTO;
};

async function fetchFavorites(): Promise<FavoriteItem[]> {
  const response = await fetch("/api/user/favorites");

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch favorites");
  }

  return response.json();
}

async function toggleFavorite({
  bookId,
  isFavorited,
}: ToggleFavoriteInput) {
  const response = isFavorited
    ? await fetch(`/api/user/favorites/${bookId}`, { method: "DELETE" })
    : await fetch("/api/user/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

  if (!response.ok) {
    throw new Error("Failed to update favorites");
  }

  return response.json();
}

function updateFavoriteCount(count: number, isFavorited: boolean) {
  return Math.max(0, count + (isFavorited ? 1 : -1));
}

function withOptimisticFavorite<T extends BookListItem | BookDetailDTO>(
  book: T,
  bookId: number,
  isFavorited: boolean,
): T {
  if (book.id !== bookId) {
    return book;
  }

  return {
    ...book,
    isFavorited,
    _count: {
      ...book._count,
      favorites: updateFavoriteCount(book._count.favorites, isFavorited),
    },
  };
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (variables): Promise<ToggleFavoriteContext> => {
      const bookQueryKey = ["book", variables.bookId.toString()];

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["favorites"] }),
        queryClient.cancelQueries({ queryKey: ["books"] }),
        queryClient.cancelQueries({ queryKey: bookQueryKey }),
      ]);

      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(["favorites"]);
      const previousBooks = queryClient.getQueriesData<BooksResponse>({ queryKey: ["books"] });
      const previousBook = queryClient.getQueryData<BookDetailDTO>(bookQueryKey);
      const nextIsFavorited = !variables.isFavorited;

      queryClient.setQueryData<BookDetailDTO>(bookQueryKey, (oldBook) =>
        oldBook
          ? withOptimisticFavorite(oldBook, variables.bookId, nextIsFavorited)
          : oldBook,
      );

      previousBooks.forEach(([queryKey]) => {
        queryClient.setQueryData<BooksResponse>(queryKey, (oldData) =>
          oldData
            ? {
                ...oldData,
                books: oldData.books.map((book) =>
                  withOptimisticFavorite(book, variables.bookId, nextIsFavorited),
                ),
              }
            : oldData,
        );
      });

      if (variables.isFavorited) {
        queryClient.setQueryData<FavoriteItem[]>(["favorites"], (oldFavorites) =>
          oldFavorites?.filter((favorite) => favorite.bookId !== variables.bookId) ?? oldFavorites,
        );
      }

      return {
        previousFavorites,
        previousBooks,
        previousBook,
      };
    },
    onError: (_error, variables, context) => {
      const bookQueryKey = ["book", variables.bookId.toString()];

      if (context?.previousFavorites !== undefined) {
        queryClient.setQueryData(["favorites"], context.previousFavorites);
      }

      context?.previousBooks.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      if (context?.previousBook !== undefined) {
        queryClient.setQueryData(bookQueryKey, context.previousBook);
      }

      toast.error("Failed to update favorites");
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.isFavorited ? "Removed from favorites" : "Added to favorites");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      if (variables?.bookId) {
        queryClient.invalidateQueries({ queryKey: ["book", variables.bookId.toString()] });
      }
    },
  });
}
