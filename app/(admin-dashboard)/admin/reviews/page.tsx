"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { VirtualAdminList } from "@/components/admin/VirtualAdminList";

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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const response = await fetch("/api/admin/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      setLoading(false);
    }
  }

  async function handleToggleApproval(reviewId: number, currentStatus: boolean) {
    setUpdating(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });
      if (response.ok) {
        toast.success("Review Updated successfully!");
        fetchReviews();
      } else {
        toast.error("Failed to update review");
      }
    } catch {
      toast.error("An error occurred while updating the review");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(reviewId: number) {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }
    setUpdating(reviewId);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Review deleted successfully!");
        fetchReviews();
      } else {
        toast.error("Failed to deleting review");
      }
    } catch {
      toast.error("An error occurred while deleting the review");
    } finally {
      setUpdating(null);
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    if (filter === "approved") return review.isApproved;
    if (filter === "pending") return !review.isApproved;
    if (filter === "verified") return review.isVerifiedPurchase;
    return true;
  });

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Reviews
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage user book reviews and ratings
        </p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Reviews</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {reviews.length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Average Rating</div>
          <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400 tracking-tight">
            {averageRating} ★
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Approved</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {reviews.filter((r) => r.isApproved).length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pending</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 tracking-tight">
            {reviews.filter((r) => !r.isApproved).length}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "all"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "approved"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "pending"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("verified")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "verified"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Verified Purchase
        </button>
      </div>

      <VirtualAdminList
        items={filteredReviews}
        estimateItemHeight={232}
        getItemKey={(review) => review.id}
        emptyMessage="No reviews found."
        resetKey={filter}
        renderItem={(review) => (
          <div
            key={review.id}
            className="mb-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              {review.book.coverImageUrl && (
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={review.book.coverImageUrl}
                    alt={review.book.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {" "}
                      {review.book.author}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xl ${
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {review.reviewTitle && (
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {review.reviewTitle}
                  </h3>
                )}

                {review.reviewText && (
                  <p className="text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
                    {review.reviewText}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <Link
                    href={`/admin/users/${review.user.id}`}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
                  >
                    {review.user.fullName}
                  </Link>
                  <span>•</span>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>

                  {review.isVerifiedPurchase && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Verified Purchase
                      </span>
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
                        ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400 disabled:opacity-50"
                        : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                    } disabled:opacity-50`}
                  >
                    {updating === review.id
                      ? "Updating..."
                      : review.isApproved
                        ? "Unapprove"
                        : "Approve"}
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
        )}
      />
    </div>
  );
}
