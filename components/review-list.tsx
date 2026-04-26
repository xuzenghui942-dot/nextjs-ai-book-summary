"use client";

import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import StarRating from "@/components/star-rating";

interface Review {
  id: number;
  rating: number;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    fullName: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export default function ReviewList({
  reviews,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: ReviewListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? reviews.length + 1 : reviews.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} className="max-h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const isLoaderRow = virtualItem.index > reviews.length - 1;
          const review = reviews[virtualItem.index];

          return (
            <div
              key={virtualItem.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
            >
              {isLoaderRow ? (
                <div
                  className="py-6 text-center"
                  onMouseEnter={loadMore}
                >
                  {isFetchingNextPage ? (
                    <span className="text-slate-500 dark:text-slate-400">
                      Loading more reviews...
                    </span>
                  ) : (
                    <button
                      onClick={loadMore}
                      className="px-4 py-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Load more reviews
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-b border-slate-200 dark:border-slate-700 pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {review.user.fullName}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <StarRating rating={review.rating} />
                        {review.isVerifiedPurchase && (
                          <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full font-semibold">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {review.reviewText}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}