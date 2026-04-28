"use client";

import { useQuery } from "@tanstack/react-query";
import type { CategoryDTO } from "@/types/api";

async function fetchCategories(): Promise<CategoryDTO[]> {
  const response = await fetch("/api/user/categories");

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  return response.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}
