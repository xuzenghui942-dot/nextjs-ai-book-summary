"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import type { UseBooksParams } from "@/hooks/useBooks";

function normalizePage(value: string | null) {
  const page = Number(value ?? "1");
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeCategory(value: string | null) {
  if (!value) {
    return "";
  }

  const categoryId = Number(value);
  return Number.isInteger(categoryId) && categoryId > 0 ? value : "";
}

function buildBooksUrl(pathname: string, search: string, category: string, page: number) {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  if (category) {
    params.set("category", category);
  }

  if (page > 1) {
    params.set("page", page.toString());
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function useBookFilters(limit = 12) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("search") ?? "";
  const initialCategory = normalizeCategory(searchParams.get("category"));
  const initialPage = normalizePage(searchParams.get("page"));

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [category, setCategoryState] = useState(initialCategory);
  const [page, setPage] = useState(initialPage);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    router.replace(buildBooksUrl(pathname, debouncedSearch, category, page), {
      scroll: false,
    });
  }, [category, debouncedSearch, page, pathname, router]);

  const setSearch = (nextSearch: string) => {
    setSearchInput(nextSearch);
    setPage(1);
  };

  const setCategory = (nextCategory: string) => {
    setCategoryState(normalizeCategory(nextCategory));
    setPage(1);
  };

  const queryFilters: UseBooksParams = {
    search: debouncedSearch.trim(),
    category,
    page,
    limit,
  };

  return {
    searchInput,
    setSearchInput: setSearch,
    debouncedSearch,
    category,
    setCategory,
    page,
    setPage,
    queryFilters,
  };
}
