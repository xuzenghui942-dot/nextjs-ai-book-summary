// types/api.ts
// 基础 DTO 类型定义，供前后端共享
// Step 0 创建基础类型，Step 6 补充 Zod schema

export type ApiError = {
  error: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  subscriptionTier: "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME";
  subscriptionStatus: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  audioListenTime: number;
  createdAt: string;
};

export type CategoryDTO = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
};

export type BookListItem = {
  id: number;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  category: CategoryDTO;
  averageRating: number;
  isFavorited: boolean;
  _count: {
    reviews: number;
    favorites: number;
  };
};

export type BookChapterDTO = {
  id: number;
  chapterNumber: number;
  chapterTitle: string;
  chapterSummary: string;
  audioUrl: string | null;
  audioDuration: number;
};

export type BookReviewDTO = {
  id: number;
  rating: number;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type BookDetailDTO = {
  id: number;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  originalPdfUrl: string | null;
  summary: {
    id: number;
    mainSummary: string | null;
    keyTakeaways: unknown;
    fullSummary: string | null;
    tableOfContents: unknown;
  } | null;
  chapters: BookChapterDTO[];
  category: CategoryDTO;
  reviews: BookReviewDTO[];
  averageRating: number;
  isFavorited: boolean;
  userSubscriptionTier?: string;
  _count: {
    reviews: number;
    favorites: number;
  };
};

export type FavoriteItem = {
  id: number;
  bookId: number;
  createdAt: string;
  book: BookListItem;
};
