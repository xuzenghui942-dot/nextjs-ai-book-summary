"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface Review {
  id: number;
  rating: number;
  reviewTitle: string | null;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  book: {
    id: number;
    title: string;
    author: string;
    coverImageUrl: string | null;
  };
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });

  const fetchReviews = useCallback(async (page = 1, status = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (status && status !== "all") {
        if (status === "approved") params.set("status", "approved");
        else if (status === "pending") params.set("status", "pending");
      }
      const response = await fetch(`/api/admin/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReviews(1, filter);
  }, [filter, fetchReviews]);

  async function handleToggleApproval(reviewId: number, currentStatus: boolean) {
    setUpdating(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });
      if (response.ok) {
        toast.success("Review updated successfully!");
        fetchReviews(pagination.page, filter);
      } else {
        toast.error("Failed to update review");
      }
    } catch (error) {
      toast.error("An error occurred while updating the review");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(reviewId: number) {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setUpdating(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Review deleted successfully!");
        fetchReviews(pagination.page, filter);
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the review");
    } finally {
      setUpdating(null);
    }
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const goToPage = (page: number) => {
    fetchReviews(page, filter);
  };

  const getPageNumbers = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  const pageNumbers = useMemo(
    () => getPageNumbers(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reviews</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage user book reviews and ratings</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
        {["all", "approved", "pending"].map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              filter === f
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {f === "all" ? "All Reviews" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-500">No reviews found.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {review.book.coverImageUrl && (
                  <Image src={review.book.coverImageUrl} alt={review.book.title} width={80} height={112} className="w-20 h-28 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/admin/books/${review.book.id}/details`}
                        className="text-lg font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {review.book.title}
                      </Link>
                      <p className="text-sm text-slate-500 dark:text-slate-400">by {review.book.author}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xl ${i < review.rating ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {review.reviewTitle && <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{review.reviewTitle}</h3>}
                  {review.reviewText && <p className="text-slate-700 dark:text-slate-300 mb-3">{review.reviewText}</p>}
                  <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                    <Link href={`/admin/users/${review.user.id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium">
                      {review.user.fullName}
                    </Link>
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    {review.isVerifiedPurchase && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Verified Purchase</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{review.helpfulCount} found helpful</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        review.isApproved
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                          : "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400"
                      }`}
                    >
                      {review.isApproved ? "Approved" : "Pending Approval"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleApproval(review.id, review.isApproved)}
                      disabled={updating === review.id}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        review.isApproved
                          ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400"
                          : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                      } disabled:opacity-50`}
                    >
                      {updating === review.id ? "Updating..." : review.isApproved ? "Unapprove" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={updating === review.id}
                      className="px-4 py-2 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-lg text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-900 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-slate-400 dark:text-slate-600">...</span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p as number)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  pagination.page === p ? "bg-emerald-600 text-white" : "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {pagination.totalCount > 0 && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} reviews
        </div>
      )}
    </div>
  );
}