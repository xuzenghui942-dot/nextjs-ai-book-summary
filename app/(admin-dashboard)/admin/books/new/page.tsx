"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Category {
  id: number;
  name: string;
}

export default function AddNewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [summaryProgress, setSummaryProgress] = useState("");
  const [audioProgress, setAudioProgress] = useState("");
  const [bookId, setBookId] = useState<number | null>(null);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [audioGenerated, setAudioGenerated] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    categoryId: "",
    description: "",
    publicationYear: "",
    isbn: "",
    tags: "",
    isFeatured: false,
    isPublished: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    }
    fetchCategories();
  }, []);

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

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      let coverImageUrl = "";
      let pdfUrl = "";
      if (coverImageFile) {
        const formData = new FormData();
        formData.append("file", coverImageFile);
        formData.append("type", "cover");
        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          coverImageUrl = data.url;
        }
      }
      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        formData.append("type", "pdf");
        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          pdfUrl = data.url;
        }
      }

      const response = await fetch("/api/admin/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          categoryId: parseInt(formData.categoryId),
          description: formData.description,
          publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : null,
          isbn: formData.isbn || null,
          tags: formData.tags || null,
          coverImageUrl: coverImageUrl || null,
          pdfUrl: pdfUrl || null,
          isFeatured: formData.isFeatured,
          isPublished: formData.isPublished,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || "Failed to create book" });
        }
        setLoading(false);
        return;
      }

      setBookId(data.id);
      setSummaryGenerated(false);
      setAudioGenerated(false);
      setSummaryProgress("");
      setAudioProgress("");
      setLoading(false);
      toast.success("Book created successfully! You can now generate summary");
    } catch (error) {
      setErrors({ general: "Failed to create book" });
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!bookId) {
      toast.error("Please save the book first before generating summary");
      return;
    }
    setGeneratingSummary(true);
    setSummaryProgress("Extracting text from PDF...");

    try {
      const response = await fetch("/api/admin/books/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to generate summary");
      }

      if (!response.body) {
        throw new Error("Summary generation stream is empty");
      }

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
                setSummaryGenerated(true);
                toast.success("Summary generated successfully");
                return;
              }
            }
          }
        }
      }

      throw new Error("Summary generation stream ended before completion");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate summary";
      setGeneratingSummary(false);
      setSummaryProgress(message);
      toast.error(message);
    }
  };

  const handleGenerateAudio = async () => {
    if (!bookId) {
      toast.error("Please save the book first before generating audio");
      return;
    }

    if (!summaryGenerated) {
      toast.error("Please generate summary first before generating audio");
      return;
    }

    setGeneratingAudio(true);
    setAudioProgress("Generating audio from summary...");
    try {
      const response = await fetch("/api/admin/books/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId, force: audioGenerated }),
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
              setAudioGenerated(true);
              toast.success("Audio generated successfully");
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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Add New Book</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Create a new book entry with AI-generated summary and audio
        </p>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Book Information */}
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description *
                </label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Upload Cover Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg"
                  />
                  {coverImagePreview && (
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="mt-2 w-32 h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Upload PDF File *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded-lg"
                  />
                  {pdfFile && <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">✓ {pdfFile.name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Publication Year
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg"
                    placeholder="business, finance"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Publishing Options */}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Book"}
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50"
              onClick={() => router.push("/admin/books")}
              disabled={loading || generatingSummary || generatingAudio}
            >
              Go to Books
            </button>
          </div>
        </form>

        {/* AI Summary Generation */}
        {bookId && (
          <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🤖 AI Summary Generation</h2>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                {summaryGenerated
                  ? "Summary generated successfully. You can now generate audio."
                  : "Generate AI-powered summary using ChatGPT"}
              </p>
              {summaryProgress && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-400">{summaryProgress}</p>
                </div>
              )}

              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {generatingSummary
                  ? "Generating..."
                  : summaryGenerated
                    ? "Regenerate Summary"
                    : "Generate Summary with ChatGPT"}
              </button>
            </div>
          </div>
        )}

        {/* Audio Generation */}
        {bookId && summaryGenerated && (
          <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🎧 Audio Generation</h2>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                {audioGenerated
                  ? "Audio generated successfully. You can regenerate it if needed."
                  : "Generate audio using Text-to-Speech"}
              </p>

              {audioProgress && (
                <div className="bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-900 rounded-lg p-4">
                  <p className="text-sm text-teal-800 dark:text-teal-400">{audioProgress}</p>
                </div>
              )}

              <button
                onClick={handleGenerateAudio}
                disabled={generatingAudio}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
              >
                {generatingAudio
                  ? "Generating..."
                  : audioGenerated
                    ? "Regenerate Audio"
                    : "🎧 Generate Audio"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
