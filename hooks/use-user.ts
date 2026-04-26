import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/fetcher";

export function useUser() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => fetcher<any>("/api/user/profile"),
    enabled: !!session,
  });
}