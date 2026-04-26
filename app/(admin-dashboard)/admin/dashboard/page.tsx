import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const [
    totalBooks,
    totalUsers,
    totalCategories,
    paidSubscriptions,
    recentUsers,
    recentBooks,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.user.count({
      where: {
        subscriptionTier: {
          in: ["MONTHLY", "YEARLY", "LIFETIME"],
        },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        subscriptionTier: true,
        createdAt: true,
      },
    }),
    prisma.book.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        author: true,
        isPublished: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Welcome back, {session.user.name || "Admin"}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Books</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                {totalBooks}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                {totalUsers}
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Paid Subscribers
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                {paidSubscriptions}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Categories</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                {totalCategories}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏷️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Users</h2>
          </div>
          <div className="p-6">
            {recentUsers.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-500 text-center py-8">No users yet</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {user.fullName || "No Name"}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.subscriptionTier === "LIFETIME"
                            ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400"
                            : user.subscriptionTier === "YEARLY"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                              : user.subscriptionTier === "MONTHLY"
                                ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {user.subscriptionTier}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Books</h2>
          </div>
          <div className="p-6">
            {recentBooks.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-500 text-center py-8">No books yet</p>
            ) : (
              <div className="space-y-4">
                {recentBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {book.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{book.author}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${book.isPublished ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"}`}
                      >
                        {book.isPublished ? "PUBLISHED" : "DRAFT"}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/books/new"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all flex items-center space-x-3"
          >
            <span className="text-2xl">➕</span>
            <span className="font-semibold">Add New Book</span>
          </a>
          <a
            href="/admin/books"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all flex items-center space-x-3"
          >
            <span className="text-2xl">📖</span>
            <span className="font-semibold">Manage Books</span>
          </a>
          <a
            href="/admin/users"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all flex items-center space-x-3"
          >
            <span className="text-2xl">👤</span>
            <span className="font-semibold">Manage Users</span>
          </a>
        </div>
      </div>
    </div>
  );
}
