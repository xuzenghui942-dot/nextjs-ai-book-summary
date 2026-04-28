"use client";

import Link from "next/link";
import { VirtualAdminTable } from "@/components/admin/VirtualAdminTable";

export type AdminBookListItem = {
  id: number;
  title: string;
  author: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  audioGenerated: boolean;
  createdAt: string;
  category: {
    name: string;
  } | null;
  _count: {
    reviews: number;
  };
};

const columns = [
  { key: "book", label: "Book" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "audio", label: "Audio" },
  { key: "reviews", label: "Reviews" },
  { key: "created", label: "Created" },
  { key: "actions", label: "Actions", className: "text-right" },
];

const gridTemplateColumns = "minmax(280px,2fr) minmax(150px,1fr) 130px 100px 100px 130px 210px";

type AdminBooksTableProps = {
  books: AdminBookListItem[];
};

export function AdminBooksTable({ books }: AdminBooksTableProps) {
  return (
    <VirtualAdminTable
      items={books}
      columns={columns}
      gridTemplateColumns={gridTemplateColumns}
      estimateRowHeight={88}
      getItemKey={(book) => book.id}
      emptyMessage="No books found."
      minWidth="1100px"
      renderRow={(book) => (
        <div
          role="row"
          className="grid h-[88px] border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          style={{ gridTemplateColumns }}
        >
          <div className="px-6 py-3 min-w-0">
            <div className="flex items-center space-x-3">
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt={book.title} className="w-12 h-16 object-cover rounded" />
              ) : (
                <div className="w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center shrink-0">
                  <span className="text-2xl">📖</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{book.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{book.author}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center">
            <span className="inline-block max-w-full truncate px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
              {book.category?.name || "Uncategorized"}
            </span>
          </div>
          <div className="px-6 py-4 flex items-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                book.isPublished
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
              }`}
            >
              {book.isPublished ? "PUBLISHED" : "DRAFT"}
            </span>
          </div>
          <div className="px-6 py-4 flex items-center">
            {book.audioGenerated ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Yes</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-600">No</span>
            )}
          </div>
          <div className="px-6 py-4 flex items-center">
            <span className="text-slate-700 dark:text-slate-300 font-medium">{book._count.reviews}</span>
          </div>
          <div className="px-6 py-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
            {new Date(book.createdAt).toLocaleDateString()}
          </div>
          <div className="px-6 py-4 flex items-center justify-end">
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
          </div>
        </div>
      )}
    />
  );
}
