"use client";

type ReadingProgress = {
  chapterIndex: number;
  audioPosition: number;
  completionPercentage: number;
};

export async function fetchReadingProgress(bookId: number): Promise<ReadingProgress | null> {
  const response = await fetch(`/api/user/reading-history/${bookId}`);

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch reading progress");
  }

  return response.json();
}

export async function saveReadingProgress({
  bookId,
  chapterIndex,
  audioPosition,
  completionPercentage,
}: ReadingProgress & { bookId: number }) {
  const response = await fetch(`/api/user/reading-history/${bookId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chapterIndex,
      audioPosition,
      completionPercentage,
    }),
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to save reading progress");
  }

  return response.json();
}
