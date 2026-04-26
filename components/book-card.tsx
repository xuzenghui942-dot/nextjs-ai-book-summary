import { memo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import StarRating from "@/components/star-rating";

interface BookCardProps {
  id: number;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string | null;
  averageRating: number;
  reviewCount: number;
  isFavorited: boolean;
  category: { id: number; name: string; icon: string | null };
  subscriptionTier?: string;
  onToggleFavorite: (bookId: number, isFavorited: boolean) => void;
  isPendingFavorite: boolean;
}

function BookCardInner({
  id,
  title,
  author,
  description,
  coverImageUrl,
  averageRating,
  reviewCount,
  isFavorited,
  category,
  subscriptionTier,
  onToggleFavorite,
  isPendingFavorite,
}: BookCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/books/${id}`}>
        <div className="relative h-64 bg-slate-100 dark:bg-slate-700">
          {coverImageUrl ? (
            <Image src={coverImageUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <span className="text-6xl">📖</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(id, isFavorited);
            }}
            disabled={isPendingFavorite}
            className="absolute top-3 right-3 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-xl">{isFavorited ? "❤️" : "🤍"}</span>
          </button>
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {category.icon && <span className="mr-1">{category.icon}</span>}
            {category.name}
          </span>
        </div>
        <Link href={`/books/${id}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400">{title}</h3>
        </Link>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">by {author}</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between">
          <StarRating rating={averageRating} />
          <span className="text-xs text-slate-500 dark:text-slate-400">{reviewCount} reviews</span>
        </div>
        {subscriptionTier === "FREE" && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Link href="/pricing" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300">🔒 Upgrade to unlock full audio & PDF</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BookCardInner);