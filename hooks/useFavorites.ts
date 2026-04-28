"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FavoriteItem } from "@/types/api";

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
}: {
  bookId: number;
  isFavorited: boolean;
}) {
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
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      if (variables?.bookId) {
        queryClient.invalidateQueries({ queryKey: ["book", variables.bookId.toString()] });
      }
    },
  });
}
