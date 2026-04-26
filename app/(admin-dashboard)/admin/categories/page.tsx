"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  _count?: {
    books: number;
  };
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function fetchCategories() {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Are your sure you want to delete "${name}"? This action cannot be undone`)) {
      return;
    }
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to delete category");
        setDeleting(null);
        return;
      }

      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      toast.error("An error occurred while deleting the category");
    } finally {
      setDeleting(null);
    }
  }

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage book categories and organize your library</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg"
        >
          + Add New Category
        </Link>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Icon
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Books
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
                    No categories found. Create your first category to get started.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50" key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.icon ? (
                        <span className="text-2xl">{category.icon}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-sm">No icon</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400">
                        {category._count?.books || 0} books
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{category.displayOrder}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          category.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-semibold text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 font-semibold text-sm disabled:opacity-50"
                          onClick={() => handleDelete(category.id, category.name)}
                          disabled={deleting === category.id}
                        >
                          {deleting === category.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Categories</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{categories.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Categories</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {categories.filter((c) => c.isActive).length}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Books</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {categories.reduce((sum, c) => sum + (c._count?.books || 0), 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
