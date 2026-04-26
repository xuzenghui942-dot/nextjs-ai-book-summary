import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => fetcher<any[]>("/api/user/favorites"),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, isFavorited }: { bookId: number; isFavorited: boolean }) => {
      if (isFavorited) {
        const res = await fetch(`/api/user/favorites/${bookId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove favorite");
      } else {
        const res = await fetch("/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });
        if (!res.ok) throw new Error("Failed to add favorite");
      }
    },
    onMutate: async ({ bookId, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      await queryClient.cancelQueries({ queryKey: ["books"] });

      const previousFavorites = queryClient.getQueryData(["favorites"]);

      queryClient.setQueryData(["favorites"], (old: any[] | undefined) => {
        if (!old) return old;
        if (isFavorited) {
          return old.filter((f: any) => f.bookId !== bookId);
        }
        return [...old, { bookId, createdAt: new Date().toISOString() }];
      });

      queryClient.setQueriesData<any>({ queryKey: ["books"] }, (old: any) => {
        if (!old?.books) return old;
        return {
          ...old,
          books: old.books.map((b: any) =>
            b.id === bookId ? { ...b, isFavorited: !isFavorited } : b
          ),
        };
      });

      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["favorites"], context?.previousFavorites);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.error("Failed to update favorites");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onSuccess: (_, { isFavorited }) => {
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
    },
  });
}