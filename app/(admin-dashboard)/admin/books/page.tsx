import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "@/components/pagination";

export default async function AdminBookPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const search = params.search || "";
  const limit = 20;
  const skip = (currentPage - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }

  const [books, totalCount, stats] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        category: { select: { name: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.book.count({ where }),
    prisma.book.aggregate({
      _count: {
        isPublished: true,
        audioGenerated: true,
      },
      where: {},
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const totalBooks = totalCount;
  const publishedCount = await prisma.book.count({ where: { isPublished: true } });
  const draftCount = totalBooks - publishedCount;
  const audioCount = await prisma.book.count({ where: { audioGenerated: true } });

  const searchParamObj: Record<string, string> = {};
  if (search) searchParamObj.search = search;

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Books</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalBooks}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Published</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{publishedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Draft</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">With Audio</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{audioCount}</p>
        </div>
      </div>

      <form method="GET" action="/admin/books" className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search books by title or author..."
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/books"
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {books.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {search ? "No books match your search" : "No books yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {search ? "Try adjusting your search terms" : "Get started by adding your first book"}
            </p>
            {!search && (
              <Link
                href="/admin/books/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                + Add New Book
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Book
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Audio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Reviews
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {book.coverImageUrl ? (
                            <Image
                              src={book.coverImageUrl}
                              alt={book.title}
                              width={48}
                              height={64}
                              className="w-12 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                              <span className="text-2xl">📖</span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{book.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                          {book.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            book.isPublished
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {book.isPublished ? "PUBLISHED" : "DRAFT"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {book.audioGenerated ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Yes</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">✗ No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{book._count.reviews}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/books/${book.id}/details`}
                            className="px-3 py-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors text-sm font-medium"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/books/${book.id}/edit`}
                            className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button className="px-3 py-1.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-400">
              Showing {skip + 1}-{Math.min(skip + limit, totalCount)} of {totalCount} books
            </div>
          </>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/books"
        searchParams={searchParamObj}
      />
    </div>
  );
}