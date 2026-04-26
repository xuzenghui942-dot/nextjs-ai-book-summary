"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  emailVerified: boolean;
  createdAt: string;
  _count?: {
    favorites: number;
    readingHistory: number;
    reviews: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? (input instanceof Request ? input.method : "GET");

      try {
        return await originalFetch(input, init);
      } catch (error) {
        console.error("[admin/users] fetch failed", {
          url,
          method,
          error,
        });
        throw error;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[admin/users] unhandled rejection", {
        reason: event.reason,
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    fetchUsers();

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  async function fetchUsers() {
    const usersUrl = "/api/admin/users";

    try {
      const response = await fetch(usersUrl);
      console.log("[admin/users] users request finished", {
        url: usersUrl,
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("[admin/users] users request returned non-OK", {
          url: usersUrl,
          status: response.status,
          body: await response.text(),
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("[admin/users] failed to fetch users", {
        url: usersUrl,
        error,
      });
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    if (filter === "admin") return user.role === "ADMIN";
    if (filter === "premium") return user.subscriptionTier !== "FREE";
    if (filter === "free") return user.subscriptionTier === "FREE";
    return true;
  });

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "LIFETIME":
        return "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400";
      case "YEARLY":
        return "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400";
      case "MONTHLY":
        return "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400";
      case "CANCELLED":
        return "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400";
      case "EXPIRED":
        return "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Users</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage user accounts and subscriptions</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{users.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Premium Users</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {users.filter((u) => u.subscriptionTier !== "FREE").length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Free Users</div>
          <div className="text-3xl font-bold text-slate-600 dark:text-slate-400 tracking-tight">
            {users.filter((u) => u.subscriptionTier === "FREE").length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Verified Emails</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {users.filter((u) => u.emailVerified).length}
          </div>
        </div>
      </div>

      {/* Filters */}
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
          All Users
        </button>
        <button
          onClick={() => setFilter("premium")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "premium"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Premium
        </button>
        <button
          onClick={() => setFilter("free")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "free"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Free
        </button>
        <button
          onClick={() => setFilter("admin")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === "admin"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Admins
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{user.fullName}</div>
                          {user.emailVerified && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Verified</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getTierBadgeColor(user.subscriptionTier)}`}
                      >
                        {user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(user.subscriptionStatus)}`}
                      >
                        {user.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <div>{user._count?.favorites || 0} favorites</div>
                        <div>{user._count?.reviews || 0} reviews</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-slate-900 dark:text-slate-300 hover:underline font-semibold text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
