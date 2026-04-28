"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserLayout } from "@/components/layout/UserLayout";
import { BookCard } from "@/components/ui/BookCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useBookFilters } from "@/hooks/useBookFilters";
import { useBooks } from "@/hooks/useBooks";
import { useCategories } from "@/hooks/useCategories";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useUser } from "@/hooks/useUser";

function BooksContent() {
  const router = useRouter();
  const {
    searchInput,
    setSearchInput,
    category,
    setCategory,
    page,
    setPage,
    queryFilters,
  } = useBookFilters(12);

  const { user } = useUser();
  const { data: categories = [] } = useCategories();
  const { data: booksData, isLoading: booksLoading } = useBooks(queryFilters);
  const toggleFavorite = useToggleFavorite();

  const books = booksData?.books ?? [];
  const totalPages = booksData?.pagination.totalPages ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleToggleFavorite = async (bookId: number, isFavorited: boolean) => {
    if (!user) {
      toast.error("Please log in to add favorites");
      router.push("/login");
      return;
    }

    try {
      await toggleFavorite.mutateAsync({ bookId, isFavorited });
    } catch (error) {
      console.error("Failed to toggle favorites:", error);
    }
  };

  return (
    <UserLayout
      activePath="/books"
      contentClassName="max-w-7xl mx-auto px-4 py-12"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Browse Books</h1>
        <p className="text-slate-600 dark:text-slate-400">Discover 10,000+ professional book summaries</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search books by title, author, or keywords..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Filter by Category:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === ""
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              All Categories
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategory(category.id.toString())}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  queryFilters.category === category.id.toString()
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {booksLoading ? (
        <LoadingSkeleton count={8} />
      ) : books.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No books found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                user={user}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </UserLayout>
  );
}

export default function BooksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-xl text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      }
    >
      <BooksContent />
    </Suspense>
  );
}
