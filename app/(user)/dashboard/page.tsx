"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserLayout } from "@/components/layout/UserLayout";
import type { UserProfile } from "@/types/api";

interface SubscriptionOrder {
  id: number;
  planType: string;
  amount: string;
  orderStatus: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchOrders();
  }, []);

  async function fetchUserData() {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        const sessionResponse = await fetch("/api/auth/session");
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.user) {
            setUser(sessionData.user);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      const response = await fetch("/api/subscription-orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch Order data:", error);
    }
  }

  const formatListenTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "LIFETIME":
        return "from-teal-600 to-amber-600";
      case "YEARLY":
        return "from-blue-600 to-emerald-600";
      case "MONTHLY":
        return "from-green-600 to-emerald-600";
      default:
        return "from-slate-600 to-slate-700";
    }
  };

  const getTierBenefits = (tier: string) => {
    if (tier === "FREE") {
      return {
        title: "Free Tier",
        features: [
          "Browse all books catalog",
          "Read book descriptions",
          "View table of contents",
          "Listen to ONLY 10 seconds of audio",
          "Add reviews and ratings",
        ],
        limitations: [
          "Cannot listen to full audio",
          "Cannot download PDFs",
          "No favorites feature",
        ],
      };
    } else {
      return {
        title: `${tier} Plan`,
        features: [
          "Full access to 10,000+ book summaries",
          "Read complete summaries online",
          "Listen to full audio summaries",
          "Download PDFs",
          "Add books to favorites",
          "Unlimited access",
        ],
        limitations: [],
      };
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const benefits = getTierBenefits(user.subscriptionTier);
  const pendingOrder = orders.find((o) => o.orderStatus === "PENDING");

  return (
    <UserLayout user={user} activePath="/dashboard" onSignOut={handleSignOut}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user.fullName}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your subscription and track your learning progress
          </p>
        </div>

        {pendingOrder && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-xl p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">
                  Payment Under Review
                </h3>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  Your {pendingOrder.planType} subscription payment ($
                  {pendingOrder.amount}) is being reviewed by our team. You'll receive an email once
                  your subscription is activated (usually within 24 hours).
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div
              className={`bg-gradient-to-br ${getTierColor(user.subscriptionTier)} rounded-2xl p-8 text-white shadow-xl`}
            >
              <div className="mb-6">
                <p className="text-white/80 text-sm mb-2">Current Plan</p>
                <h2 className="text-3xl font-bold">{benefits.title}</h2>
              </div>

              <div className="mb-6 pb-6 border-b border-white/20">
                <p className="text-white/80 text-sm mb-1">Status</p>
                <p className="text-xl font-semibold">
                  {user.subscriptionStatus === "ACTIVE" ? "✓ Active" : user.subscriptionStatus}
                </p>
              </div>

              {user.subscriptionEndDate && user.subscriptionTier !== "LIFETIME" && (
                <div className="mb-6 pb-6 border-b border-white/20">
                  <p className="text-white/80 text-sm mb-1">Renews On</p>
                  <p className="text-lg font-semibold">
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {user.subscriptionTier === "FREE" && (
                <Link
                  href="/pricing"
                  className="block w-full py-3 bg-white text-emerald-600 rounded-lg font-bold text-center hover:bg-slate-100 transition-colors"
                >
                  Upgrade to Premium
                </Link>
              )}

              {user.subscriptionTier !== "FREE" && user.subscriptionTier !== "LIFETIME" && (
                <Link
                  href="/pricing"
                  className="block w-full py-3 bg-white/20 text-white rounded-lg font-bold text-center hover:bg-white/30 transition-colors"
                >
                  Change Plan
                </Link>
              )}
            </div>

            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Total Listen Time</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatListenTime(user.audioListenTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Member Since</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Your Plan Includes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <svg
                      className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))}

                {benefits.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start">
                    <svg
                      className="w-6 h-6 text-rose-500 dark:text-rose-400 mt-0.5 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-slate-500 dark:text-slate-400">{limitation}</span>
                  </div>
                ))}
              </div>

              {user.subscriptionTier === "FREE" && (
                <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Ready to Unlock Full Access?
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 mb-4">
                    Upgrade to premium and get unlimited access to 10,000+ book summaries, full
                    audio, and PDF downloads.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg"
                  >
                    View Plans & Pricing
                  </Link>
                </div>
              )}
            </div>

            {orders.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  Subscription History
                </h2>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {order.planType} Plan
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          ${order.amount}
                        </p>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            order.orderStatus === "APPROVED"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                              : order.orderStatus === "PENDING"
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/books"
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">📚</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Browse Books
                    </span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500">→</span>
                </Link>

                <Link
                  href="/favorites"
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">❤️</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      My Favorites
                    </span>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
