"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserProfile } from "@/types/api";

type NavbarProps = {
  user?: UserProfile | null;
  activePath?: string;
  onSignOut?: () => void;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/books", label: "Browse Books" },
  { href: "/favorites", label: "My Favorites" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar({ user, activePath, onSignOut }: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* NavBar最左边是Logo部分 */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">📚</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">BookWise</span>
            </Link>

            {/* 中间是导航 */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const isActive = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-medium transition-colors ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: User actions */}
          <div className="flex items-center space-x-4">
            {/* 判断是否已经是user */}
            {user ? (
              <>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {user.subscriptionTier}
                  </p>
                </div>
                {/* Admin dashboard入口 */}
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/dashboard"
                    className="px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {/* 主题切换 */}
                <ThemeToggle />
                <button
                  onClick={onSignOut}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
