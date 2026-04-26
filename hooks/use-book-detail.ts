import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

export function useBookDetail(bookId: number | null) {
  return useQuery({
    queryKey: ["book", bookId],
    queryFn: () => fetcher<any>(`/api/books/${bookId}`),
    enabled: !!bookId,
  });
}