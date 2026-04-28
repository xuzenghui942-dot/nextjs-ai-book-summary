"use client";

import { useEffect, useRef, useState } from "react";

export type AdminVirtualItem<T> = {
  index: number;
  item: T;
  key: string | number;
  start: number;
  size: number;
};

type UseAdminVirtualizerOptions<T> = {
  items: T[];
  estimateSize: number;
  overscan?: number;
  getItemKey: (item: T, index: number) => string | number;
  resetKey?: string | number;
};

export function useAdminVirtualizer<T>({
  items,
  estimateSize,
  overscan = 6,
  getItemKey,
  resetKey,
}: UseAdminVirtualizerOptions<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const syncViewport = () => {
      setViewportHeight(element.clientHeight);
      setScrollTop(element.scrollTop);
    };

    syncViewport();
    element.addEventListener("scroll", syncViewport, { passive: true });

    const resizeObserver = new ResizeObserver(syncViewport);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", syncViewport);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.scrollTop = 0;
  }, [resetKey]);

  const totalSize = items.length * estimateSize;
  const startIndex = Math.max(0, Math.floor(scrollTop / estimateSize) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + viewportHeight) / estimateSize) + overscan,
  );

  const virtualItems: AdminVirtualItem<T>[] = [];

  // Classic fixed-height virtual list: reserve full scroll height, then only
  // render visible rows and move them into place with translateY.
  for (let index = startIndex; index < endIndex; index += 1) {
    const item = items[index];
    if (!item) continue;

    virtualItems.push({
      index,
      item,
      key: getItemKey(item, index),
      start: index * estimateSize,
      size: estimateSize,
    });
  }

  return {
    containerRef,
    totalSize,
    virtualItems,
  };
}
