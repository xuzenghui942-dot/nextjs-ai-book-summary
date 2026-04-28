"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserLayout } from "@/components/layout/UserLayout";
import { BookCard } from "@/components/ui/BookCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { UserProfile, BookListItem } from "@/types/api";

interface Favorite {
  id: number;
  bookId: number;
  createdAt: string;
  book: {
    id: number;
    title: string;
    author: string;
    description: string;
    coverImageUrl: string;
    category: {
      id: number;
      name: string;
      slug: string;
      icon: string;
    };
    averageRating: number;
    _count: {
      reviews: number;
      favorites: number;
    };
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUser();
    fetchFavorites();
  }, []);

  async function fetchUser() {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  }

  async function fetchFavorites() {
    setLoading(true);
    try {
      const response = await fetch("/api/user/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch favorites", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveFavorite = async (bookId: number, _isFavorited: boolean) => {
    if (!confirm("Remove this book from your favorites?")) {
      return;
    }
    try {
      const response = await fetch(`/api/user/favorites/${bookId}`, { method: "DELETE" });
      if (response.ok) {
        setFavorites(favorites.filter((fav) => fav.bookId !== bookId));
        toast.success("Removed from favorites");
      } else {
        toast.error("Failed to remove favorites");
      }
    } catch (error) {
      console.error("Failed to remove favorites", error);
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const toBookListItem = (favorite: Favorite): BookListItem => ({
    id: favorite.book.id,
    title: favorite.book.title,
    author: favorite.book.author,
    description: favorite.book.description,
    coverImageUrl: favorite.book.coverImageUrl,
    category: favorite.book.category,
    averageRating: favorite.book.averageRating,
    isFavorited: true,
    _count: favorite.book._count,
  });

  return (
    <UserLayout
      user={user}
      activePath="/favorites"
      onSignOut={handleSignOut}
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
              book={toBookListItem(favorite)}
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
