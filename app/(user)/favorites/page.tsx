"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import BookCard from "@/components/book-card";
import { useUser } from "@/hooks/use-user";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";

export default function FavoritesPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const { data: favorites = [], isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const handleToggleFavorite = useCallback((bookId: number, isFavorited: boolean) => {
    if (!user) {
      router.push("/login");
      return;
    }
    toggleFavorite.mutate({ bookId, isFavorited });
  }, [user, router, toggleFavorite]);

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) window.location.href = "/";
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">BookWise</span>
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">Dashboard</Link>
                <Link href="/books" className="text-slate-600 dark:text-slate-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-400">Browse Books</Link>
                <Link href="/favorites" className="text-emerald-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-white font-medium">My Favorites</Link>
                <Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">Pricing</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{user.subscriptionTier}</p>
                  </div>
                  <ThemeToggle />
                  <button onClick={handleSignOut} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Sign Out</button>
                </>
              ) : (
                <>
                  <ThemeToggle />
                  <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Sign In</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Favorites</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {isLoading ? "Loading..." : `${favorites.length} book${favorites.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-slate-600 dark:text-slate-400">Loading your favorites...</div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No favorites yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Start adding books to your favorites to keep track of the ones you love!</p>
            <Link href="/books" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">Browse Books</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite: any) => (
              <BookCard
                key={favorite.id}
                id={favorite.book.id}
                title={favorite.book.title}
                author={favorite.book.author}
                description={favorite.book.description}
                coverImageUrl={favorite.book.coverImageUrl}
                averageRating={favorite.book.averageRating}
                reviewCount={favorite.book._count.reviews}
                isFavorited={true}
                category={favorite.book.category}
                subscriptionTier={user?.subscriptionTier}
                onToggleFavorite={handleToggleFavorite}
                isPendingFavorite={toggleFavorite.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}