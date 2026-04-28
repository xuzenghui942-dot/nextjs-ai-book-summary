"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { UserLayout } from "@/components/layout/UserLayout";
import { StarRating } from "@/components/ui/StarRating";
import type { UserProfile } from "@/types/api";

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  originalPdfUrl: string | null;
  summary: {
    id: number;
    mainSummary: string | null;
    keyTakeaways: unknown;
    fullSummary: string | null;
    tableOfContents: unknown;
  } | null;
  chapters: Array<{
    id: number;
    chapterNumber: number;
    chapterTitle: string;
    chapterSummary: string;
    audioUrl: string | null;
    audioDuration: number;
  }>;
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  };
  reviews: Review[];
  averageRating: number;
  isFavorited: boolean;
  userSubscriptionTier: string;
  _count: {
    reviews: number;
    favorites: number;
  };
}

interface Review {
  id: number;
  rating: number;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export default function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchUser();
      fetchBook();
    }
  }, [resolvedParams]);

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

  async function fetchBook() {
    if (!resolvedParams) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/books/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setBook(data);
      } else if (response.status === 404) {
        toast.error("Book not found");
        router.push("/books");
      }
    } catch (error) {
      console.error("Failed to fetch book", error);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to add favorites");
      router.push("/login");
      return;
    }
    if (!book) return;
    try {
      if (book.isFavorited) {
        await fetch(`/api/user/favorites/${book.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: book.id }),
        });
      }
      fetchBook();
    } catch (error) {
      console.error("Failed to toggle favorites:", error);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleChapterChange = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  };

  const handleNextChapter = () => {
    if (!book) return;
    const chapterWithAudio = book.chapters.filter((ch) => ch.audioUrl);
    if (currentChapterIndex < chapterWithAudio.length - 1) {
      handleChapterChange(currentChapterIndex + 1);
    }
  };

  const handlePreviousChapter = () => {
    if (currentChapterIndex > 0) {
      handleChapterChange(currentChapterIndex - 1);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownloadPDF = () => {
    if (!user) {
      toast.error("Please log in to download PDFs");
      router.push("/login");
      return;
    }
    if (user.subscriptionTier === "FREE") {
      toast.error("Please upgrade to premium to download PDFs");
      router.push("/pricing");
      return;
    }
    if (book?.originalPdfUrl) {
      window.open(book.originalPdfUrl, "_blank");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to submit a review");
      router.push("/login");
      return;
    }
    if (reviewData.comment.trim().length < 10) {
      toast.error("Your review must be at least 10 characters long");
      return;
    }
    if (reviewData.comment.trim().length > 1000) {
      toast.error("Your review is too long. Please keep it under 1000 characters");
      return;
    }
    try {
      const response = await fetch("/api/user/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book?.id,
          rating: reviewData.rating,
          comment: reviewData.comment.trim(),
        }),
      });
      if (response.ok) {
        toast.success("Review submitted! It will appear after admin approval.");
        setShowReviewForm(false);
        setReviewData({ rating: 5, comment: "" });
        fetchBook();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Failed to submit review", error);
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

  if (loading || !book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Book...</div>
      </div>
    );
  }

  const chapters = book.chapters || [];
  const chaptersWithAudio = chapters.filter((ch) => ch.audioUrl);
  const currentChapter = chaptersWithAudio[currentChapterIndex];
  const isPremiumUser = user?.subscriptionTier !== "FREE";

  return (
    <UserLayout user={user} activePath="/books" onSignOut={handleSignOut}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm sticky top-24">
              <div className="relative h-96 bg-slate-100 dark:bg-slate-700 rounded-xl mb-4 overflow-hidden">
                {book.coverImageUrl ? (
                  <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                    <span className="text-8xl">📖</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {book.category.icon && <span className="mr-1">{book.category.icon}</span>}
                  {book.category.name}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{book.title}</h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">by {book.author}</p>

              <div className="flex items-center justify-between mb-4">
                <StarRating value={book.averageRating} />
                <span className="text-sm text-slate-600 dark:text-slate-400">{book._count.reviews} reviews</span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleToggleFavorite}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    book.isFavorited
                      ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {book.isFavorited ? "❤️ Remove from Favorites" : "🤍 Add to Favorites"}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={!isPremiumUser}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isPremiumUser
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isPremiumUser ? "📥 Download PDF" : "🔒 Upgrade for PDF"}
                </button>
              </div>

              {!isPremiumUser && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-2">🔒 Limited Access</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                    You can only listen to 10 seconds of audio. Upgrade to premium for full access!
                  </p>
                  <Link
                    href="/pricing"
                    className="block w-full py-2 bg-amber-600 dark:bg-amber-700 text-white rounded-lg font-semibold text-center hover:bg-amber-700 dark:hover:bg-amber-600 text-sm"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About This Book</h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{book.description}</p>
            </div>

            {chaptersWithAudio.length > 0 && currentChapter && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Audio Summary</h2>

                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-white/80">Now Playing</p>
                      <p className="font-semibold">{book.title}</p>
                      <p className="text-sm text-white/90 mt-1">
                        Chapter {currentChapter.chapterNumber}: {currentChapter.chapterTitle}
                      </p>
                    </div>

                    <button
                      onClick={handlePlayPause}
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-2xl">{isPlaying ? "⏸️" : "▶️"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button
                      onClick={handlePreviousChapter}
                      disabled={currentChapterIndex === 0}
                      className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ⏮️ Previous
                    </button>

                    <span className="text-sm text-white/80">
                      Chapter {currentChapterIndex + 1} of {chaptersWithAudio.length}
                    </span>

                    <button
                      onClick={handleNextChapter}
                      disabled={currentChapterIndex === chaptersWithAudio.length - 1}
                      className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next ⏭️
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-white/80">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    src={currentChapter?.audioUrl || ""}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadMetadata}
                    onEnded={handleNextChapter}
                    key={currentChapterIndex}
                  />

                  {!isPremiumUser && (
                    <div className="mt-4 p-3 bg-yellow-500 rounded-lg">
                      <p className="text-sm font-medium text-white">
                        ⚠️ Free users can only listen to 10 seconds. Upgrade for full access!
                      </p>
                    </div>
                  )}
                </div>

                {chaptersWithAudio.length > 1 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Select Chapter:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {chaptersWithAudio.map((chapter, index) => (
                        <button
                          key={chapter.id}
                          onClick={() => handleChapterChange(index)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentChapterIndex === index
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          Ch. {chapter.chapterNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {chapters.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Table of Contents</h2>
                <div className="space-y-4">
                  {chapters.map((chapter, index: number) => (
                    <div
                      key={index}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            Chapter {chapter.chapterNumber}: {chapter.chapterTitle}
                          </h3>
                          {chapter.chapterSummary && (
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                              {chapter.chapterSummary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reviews</h2>
                {user && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Your Rating
                    </label>
                    <StarRating
                      value={reviewData.rating}
                      interactive
                      onChange={(rating) => setReviewData({ ...reviewData, rating })}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Your Review
                      </label>
                      <span
                        className={`text-xs ${
                          reviewData.comment.length < 10
                            ? "text-rose-600"
                            : reviewData.comment.length > 1000
                              ? "text-rose-600"
                              : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {reviewData.comment.length}/1000 Characters
                        {reviewData.comment.length < 10 && " (min: 10)"}
                      </span>
                    </div>
                    <textarea
                      required
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      rows={4}
                      maxLength={1000}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Share your thoughts about this book (minimum 10 characters)..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                    >
                      Submit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {book.reviews.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No reviews yet. Be the first to review this book!
                </p>
              ) : (
                <div className="space-y-6">
                  {book.reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-200 dark:border-slate-700 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{review.user.fullName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <StarRating value={review.rating} />
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
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{review.reviewText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
