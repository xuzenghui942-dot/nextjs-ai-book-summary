import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => fetcher<any[]>("/api/user/categories"),
    staleTime: 5 * 60 * 1000,
  });
}