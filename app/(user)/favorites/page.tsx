"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@/hooks/use-user";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"}>★</span>
      ))}
      <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">({rating.toFixed(1)})</span>
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const { data: favorites = [], isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const handleRemoveFavorite = (bookId: number) => {
    if (!confirm("Remove this book from your favorites?")) return;
    toggleFavorite.mutate({ bookId, isFavorited: true });
  };

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
              <div key={favorite.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/books/${favorite.book.id}`}>
                  <div className="relative h-64 bg-slate-100 dark:bg-slate-700">
                    {favorite.book.coverImageUrl ? (
                      <Image src={favorite.book.coverImageUrl} alt={favorite.book.title} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        <span className="text-6xl">📖</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); handleRemoveFavorite(favorite.bookId); }}
                      disabled={toggleFavorite.isPending}
                      className="absolute top-3 right-3 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="text-xl">❤️</span>
                    </button>
                  </div>
                </Link>
                <div className="p-4">
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {favorite.book.category.icon && <span className="mr-1">{favorite.book.category.icon}</span>}
                      {favorite.book.category.name}
                    </span>
                  </div>
                  <Link href={`/books/${favorite.book.id}`}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400">{favorite.book.title}</h3>
                  </Link>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">by {favorite.book.author}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">{favorite.book.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <StarRating rating={favorite.book.averageRating} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{favorite.book._count.reviews} reviews</span>
                  </div>
                  <Link href={`/books/${favorite.book.id}`} className="block w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold text-center hover:bg-emerald-700 transition-colors">Read Summary</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}