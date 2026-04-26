"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

interface Category {
  id: number;
  name: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  categoryId: number;
  description: string;
  publicationYear: number | null;
  isbn: string | null;
  coverImageUrl: string | null;
  originalPdfUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  summaryGenerated: boolean;
  audioGenerated: boolean;
}

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [book, setBook] = useState<Book | null>(null);

  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState("");
  const [audioProgress, setAudioProgress] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    categoryId: "",
    description: "",
    publicationYear: "",
    isbn: "",
    isFeatured: false,
    isPublished: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const bookResponse = await fetch(`/api/admin/books/${bookId}`);
        if (bookResponse.ok) {
          const bookData = await bookResponse.json();
          setBook(bookData);
          setFormData({
            title: bookData.title,
            author: bookData.author,
            categoryId: bookData.categoryId.toString(),
            description: bookData.description,
            publicationYear: bookData.publicationYear?.toString() || "",
            isbn: bookData.isbn || "",
            isFeatured: bookData.isFeatured,
            isPublished: bookData.isPublished,
          });
        }
        const categoriesResponse = await fetch("/api/admin/categories");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
    fetchData();
  }, [bookId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          categoryId: parseInt(formData.categoryId),
          publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || "Failed to update book" });
        }
        setLoading(false);
        return;
      }
      toast.success("Book updated successfully");
      router.push("/admin/books");
    } catch (error) {
      setErrors({ general: "An error occurred while updating the book" });
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    setSummaryProgress("Extracting text from PDF...");

    try {
      const response = await fetch("/api/admin/books/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: parseInt(bookId) }),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = JSON.parse(line.slice(6));
              setSummaryProgress(data.message);
              if (data.completed) {
                setGeneratingSummary(false);
                toast.success("Summary generated successfully");
                window.location.reload();
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      setGeneratingSummary(false);
      setSummaryProgress("");
      toast.error("Failed to generate summary");
    }
  };

  const handleGenerateAudio = async () => {
    setGeneratingAudio(true);
    setAudioProgress("Generating audio from summary...");
    try {
      const response = await fetch("/api/admin/books/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: parseInt(bookId), force: Boolean(book?.audioGenerated) }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to generate audio");
      }

      if (!response.body) {
        throw new Error("Audio generation stream is empty");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = JSON.parse(line.slice(5).trim());
            setAudioProgress(data.message);

            if (data.error) {
              throw new Error(data.message || "Audio generation failed");
            }

            if (data.completed) {
              setGeneratingAudio(false);
              toast.success("Audio generated successfully");
              window.location.reload();
              return;
            }
          }
        }
      }

      throw new Error("Audio generation stream ended before completion");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate Audio";
      setGeneratingAudio(false);
      setAudioProgress(message);
      toast.error(message);
    }
  };

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600 dark:text-slate-400">Book not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Edit Book</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Update Book details and manage content</p>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📚 Book Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter book title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Author *</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter author name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter book description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Publication Year</label>
                  <input
                    type="number"
                    name="publicationYear"
                    value={formData.publicationYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg"
                    placeholder="978-0-123456-78-9"
                  />
                </div>
              </div>

              {book?.coverImageUrl && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Cover Image</label>
                  <Image
                    src={book.coverImageUrl}
                    alt={book.title}
                    width={128}
                    height={192}
                    className="w-32 h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🚀 Publishing Options</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600"
                />
                <label htmlFor="isFeatured" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Featured Book (Show on homepage)
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Publish Book (Make visible to users)
                </label>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  💡 Keep unpublished while generating summary and audio
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🤖 AI Summary Generation</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  {book.summaryGenerated
                    ? "Summary Already Generated"
                    : "Generate AI-powered summary from PDF"}
                </p>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {generatingSummary
                  ? "Generating..."
                  : book.summaryGenerated
                    ? "Regenerating Summary"
                    : "Generate Summary"}
              </button>
            </div>
            {summaryProgress && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">{summaryProgress}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🎧 Audio Generation</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  {book.audioGenerated
                    ? "Audio Already generated"
                    : book.summaryGenerated
                      ? "Generate audio from summary"
                      : " Please generate summary first"}
                </p>
              </div>
              <button
                onClick={handleGenerateAudio}
                disabled={generatingAudio || !book.summaryGenerated}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {generatingAudio
                  ? "Generating..."
                  : book.audioGenerated
                    ? "Regenerate Audio"
                    : "🎧 Generate Audio"}
              </button>
            </div>
            {audioProgress && (
              <div className="bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-900 rounded-lg p-4">
                <p className="text-sm text-teal-800 dark:text-teal-400">{audioProgress}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
