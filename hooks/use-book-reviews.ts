import { useInfiniteQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

interface Review {
  id: number;
  rating: number;
  reviewTitle: string | null;
  reviewText: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function useBookReviews(bookId: number | null) {
  return useInfiniteQuery<ReviewsResponse>({
    queryKey: ["book-reviews", bookId],
    queryFn: ({ pageParam }) =>
      fetcher<ReviewsResponse>(
        `/api/books/${bookId}/reviews?page=${pageParam}&limit=10`
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!bookId,
  });
}