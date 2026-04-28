"use client";

import Link from "next/link";
import Image from "next/image";
import { StarRating } from "./StarRating";
import type { BookListItem, UserProfile } from "@/types/api";

type BookCardProps = {
  book: BookListItem;
  user?: UserProfile | null;
  variant?: "grid" | "favorite";
  onToggleFavorite?: (bookId: number, isFavorited: boolean) => void;
};

export function BookCard({ book, user, variant = "grid", onToggleFavorite }: BookCardProps) {
  const isFavoriteVariant = variant === "favorite";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/books/${book.id}`}>
        <div className="relative h-64 bg-slate-100 dark:bg-slate-700">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <span className="text-6xl">📖</span>
            </div>
          )}

          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite?.(book.id, book.isFavorited);
              }}
              className="absolute top-3 right-3 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-xl">{book.isFavorited ? "❤️" : "🤍"}</span>
            </button>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {book.category.icon && <span className="mr-1">{book.category.icon}</span>}
            {book.category.name}
          </span>
        </div>

        <Link href={`/books/${book.id}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400">
            {book.title}
          </h3>
        </Link>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">by {book.author}</p>

        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
          {book.description}
        </p>

        <div className="flex items-center justify-between">
          <StarRating value={book.averageRating} showValue />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {book._count.reviews} reviews
          </span>
        </div>

        {user?.subscriptionTier === "FREE" && !isFavoriteVariant && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/pricing"
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              🔒 Upgrade to unlock full audio & PDF
            </Link>
          </div>
        )}

        {isFavoriteVariant && (
          <Link
            href={`/books/${book.id}`}
            className="block w-full mt-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-center hover:bg-emerald-700 transition-colors"
          >
            Read Summary
          </Link>
        )}
      </div>
    </div>
  );
}
