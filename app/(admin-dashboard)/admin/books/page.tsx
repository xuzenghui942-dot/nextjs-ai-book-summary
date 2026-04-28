import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminBooksTable } from "./AdminBooksTable";

export default async function AdminBookPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const books = await prisma.book.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const tableBooks = books.map((book) => ({
    ...book,
    createdAt: book.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Books</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage all books in the library</p>
        </div>
        <Link
          href="/admin/books/new"
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          + Add New Book
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Books</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{books.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Published</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {books.filter((b) => b.isPublished).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Draft</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {books.filter((b) => !b.isPublished).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">With Audio</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {books.filter((b) => b.audioGenerated).length}
          </p>
        </div>
      </div>

      {/* Books Table */}
      {books.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No books yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Get started by adding your first book</p>
            <Link
              href="/admin/books/new"
              className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              + Add New Book
            </Link>
          </div>
        </div>
      ) : (
        <AdminBooksTable books={tableBooks} />
      )}
    </div>
  );
}
