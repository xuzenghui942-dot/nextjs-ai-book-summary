"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <div className="animate-pulse h-40 bg-slate-200 dark:bg-slate-700 rounded" />,
});
import remarkGfm from "remark-gfm";

interface Chapter {
  id: number;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary: string;
  audioUrl: string | null;
  audioDuration: number;
}

interface Summary {
  mainSummary: string;
  tableOfContents: any;
}

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  publicationYear: number | null;
  isbn: string | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  summaryGenerated: boolean;
  audioGenerated: boolean;
  category: {
    name: string;
  };
  summary: Summary | null;
  chapters: Chapter[];
}

export default function BookDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const [currentAudio, setCurrentAudio] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBook() {
      try {
        const response = await fetch(`/api/admin/books/${bookId}/details`);
        if (response.ok) {
          const data = await response.json();
          setBook(data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch book details", error);
        setLoading(false);
      }
    }
    fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600 dark:text-slate-400">Book not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{book.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">by {book.author}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/admin/books/${bookId}/edit`}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
          >
            ✏️ Edit Book
          </Link>
          <button
            onClick={() => router.push("/admin/books")}
            className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            ← Back to Books
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          {book.coverImageUrl && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Book Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Category</p>
                <p className="font-semibold text-slate-900 dark:text-white">{book.category.name}</p>
              </div>
              {book.publicationYear && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Publication Year</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{book.publicationYear}</p>
                </div>
              )}
              {book.isbn && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">ISBN</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{book.isbn}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    book.isPublished
                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {book.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Featured</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    book.isFeatured
                      ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                  }`}
                >
                  {book.isFeatured ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">AI Generation Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Summary</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    book.summaryGenerated
                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {book.summaryGenerated ? "✓ Generated" : "✗ Not Generated"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Audio</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    book.audioGenerated
                      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {book.audioGenerated ? "✓ Generated" : "✗ Not Generated"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Description</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{book.description}</p>
          </div>

          {book.summary && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-900 rounded-xl border border-emerald-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🤖</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI-Generated Summary</h2>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 dark:[&_blockquote]:border-slate-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-slate-100 [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                    {book.summary.mainSummary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {book.chapters && book.chapters.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl">📚</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chapters</h2>
              </div>
              <div className="space-y-4">
                {book.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                          Chapter {chapter.chapterNumber} : {chapter.chapterTitle}
                        </h3>
                        {chapter.audioDuration > 0 && (
                          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                            Duration: {Math.floor(chapter.audioDuration / 60)} min{" "}
                            {chapter.audioDuration % 60} sec
                          </p>
                        )}
                      </div>
                      {chapter.audioUrl && (
                        <button
                          onClick={() =>
                            setCurrentAudio(currentAudio === chapter.id ? null : chapter.id)
                          }
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            currentAudio === chapter.id
                              ? "bg-rose-600 text-white hover:bg-rose-700"
                              : "bg-teal-600 text-white hover:bg-teal-700"
                          }`}
                        >
                          {currentAudio === chapter.id ? "⏸ Pause" : "▶ Play Audio"}
                        </button>
                      )}
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{chapter.chapterSummary}</p>

                    {chapter.audioUrl && currentAudio === chapter.id && (
                      <div className="mt-4 bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-900 rounded-lg p-4">
                        <audio
                          controls
                          autoPlay
                          className="w-full"
                          src={chapter.audioUrl}
                          onEnded={() => setCurrentAudio(null)}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {!chapter.audioUrl && (
                      <div className="mt-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-400">
                          ⚠️ Audio not generated for this chapter
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!book.summary && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Summary Generated Yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Generate an AI summary to see the book summary and chapters here
              </p>
              <Link
                href={`/admin/books/${bookId}/edit`}
                className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                Go to Edit Page to Generate Summary
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
