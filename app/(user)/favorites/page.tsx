"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserLayout } from "@/components/layout/UserLayout";
import { BookCard } from "@/components/ui/BookCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useUser } from "@/hooks/useUser";

export default function FavoritesPage() {
  const router = useRouter();
  const { user } = useUser();
  const {
    data: favorites = [],
    isLoading: loading,
    error: favoritesError,
  } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  useEffect(() => {
    if (favoritesError?.message === "Unauthorized") {
      router.push("/login");
    }
  }, [favoritesError, router]);

  const handleRemoveFavorite = async (bookId: number) => {
    if (!confirm("Remove this book from your favorites?")) {
      return;
    }
    try {
      await toggleFavorite.mutateAsync({ bookId, isFavorited: true });
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Failed to remove favorites", error);
      toast.error("Failed to remove favorites");
    }
  };

  return (
    <UserLayout
      activePath="/favorites"
      contentClassName="max-w-7xl mx-auto px-4 py-12"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Favorites</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {loading ? "Loading..." : `${favorites.length} book${favorites.length !== 1 ? "s" : ""} saved`}
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={8} />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="No favorites yet"
          description="Start adding books to your favorites to keep track of the ones you love!"
          action={{ label: "Browse Books", href: "/books" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((favorite) => (
            <BookCard
              key={favorite.id}
              book={{ ...favorite.book, isFavorited: true }}
              user={user}
              variant="favorite"
              onToggleFavorite={handleRemoveFavorite}
            />
          ))}
        </div>
      )}
    </UserLayout>
  );
}
