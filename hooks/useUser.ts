"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserProfile } from "@/types/api";
import { useUserStore } from "@/lib/store/useUserStore";

async function fetchUserProfile(): Promise<UserProfile | null> {
  const response = await fetch("/api/user/profile");

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}

export function useUser() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, clearUser } = useUserStore();

  const query = useQuery({
    queryKey: ["user"],
    queryFn: fetchUserProfile,
  });

  useEffect(() => {
    if (query.data === undefined) return;

    if (query.data) {
      setUser(query.data);
    } else {
      clearUser();
    }
  }, [clearUser, query.data, setUser]);

  const signOutUser = async () => {
    const response = await fetch("/api/auth/signout", { method: "POST" });

    if (!response.ok) {
      throw new Error("Failed to sign out");
    }

    clearUser();
    queryClient.clear();
    router.push("/");
  };

  return {
    ...query,
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data),
    signOutUser,
  };
}
