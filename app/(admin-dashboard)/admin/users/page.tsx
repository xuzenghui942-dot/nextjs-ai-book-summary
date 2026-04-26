import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Pagination } from "@/components/pagination";

function getTierBadgeColor(tier: string) {
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
}

function getStatusBadgeColor(status: string) {
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
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string; tier?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const roleFilter = params.role || "";
  const tierFilter = params.tier || "";
  const searchFilter = params.search || "";
  const limit = 20;
  const skip = (currentPage - 1) * limit;

  const where: any = {};
  if (roleFilter) where.role = roleFilter;
  if (tierFilter === "premium") where.subscriptionTier = { not: "FREE" };
  else if (tierFilter === "free") where.subscriptionTier = "FREE";
  if (searchFilter) {
    where.OR = [
      { fullName: { contains: searchFilter, mode: "insensitive" } },
      { email: { contains: searchFilter, mode: "insensitive" } },
    ];
  }

  const [users, totalCount, totalUsers, premiumCount, freeCount, verifiedCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { favorites: true, reviews: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionTier: { not: "FREE" } } }),
    prisma.user.count({ where: { subscriptionTier: "FREE" } }),
    prisma.user.count({ where: { emailVerified: true } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const filterParams: Record<string, string> = {};
  if (searchFilter) filterParams.search = searchFilter;

  const filterLink = (filterType: string, filterValue: string, label: string, isCurrent: boolean) => {
    const params = new URLSearchParams(filterParams);
    if (filterValue) {
      if (filterType === "role") {
        params.set("role", filterValue);
        params.delete("tier");
      } else {
        params.set("tier", filterValue);
        params.delete("role");
      }
    } else {
      params.delete(filterType);
      if (filterType === "role") params.delete("tier");
    }
    const href = `/admin/users?${params.toString()}`;
    return (
      <a
        href={href}
        className={`px-4 py-2 rounded-full text-sm font-semibold ${
          isCurrent
            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
      >
        {label}
      </a>
    );
  };

  const activeRoleOrTier = roleFilter || tierFilter || "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Users</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage user accounts and subscriptions</p>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Users</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{totalUsers}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Premium Users</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{premiumCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Free Users</div>
          <div className="text-3xl font-bold text-slate-600 dark:text-slate-400 tracking-tight">{freeCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Verified Emails</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{verifiedCount}</div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
        {filterLink("all", "", "All Users", activeRoleOrTier === "")}
        {filterLink("tier", "premium", "Premium", tierFilter === "premium")}
        {filterLink("tier", "free", "Free", tierFilter === "free")}
        {filterLink("role", "ADMIN", "Admins", roleFilter === "ADMIN")}
      </div>

      <form method="GET" action="/admin/users" className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            name="search"
            defaultValue={searchFilter}
            placeholder="Search by name or email..."
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
          />
          <input type="hidden" name="role" value={roleFilter} />
          <input type="hidden" name="tier" value={tierFilter} />
          <button
            type="submit"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Search
          </button>
          {searchFilter && (
            <a
              href={`/admin/users${roleFilter ? `?role=${roleFilter}` : ""}${tierFilter ? `?tier=${tierFilter}` : ""}`}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </a>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No users found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchFilter || roleFilter || tierFilter
                ? "Try adjusting your filters"
                : "Users will appear here when they sign up"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subscription</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((user) => (
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
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getTierBadgeColor(user.subscriptionTier)}`}>
                          {user.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(user.subscriptionStatus)}`}>
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          <div>{user._count.favorites} favorites</div>
                          <div>{user._count.reviews} reviews</div>
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
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-400">
              Showing {skip + 1}-{Math.min(skip + limit, totalCount)} of {totalCount} users
            </div>
          </>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/users"
        searchParams={{ ...filterParams, role: roleFilter, tier: tierFilter }}
      />
    </div>
  );
}