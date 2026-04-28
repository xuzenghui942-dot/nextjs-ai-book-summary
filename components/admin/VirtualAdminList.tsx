"use client";

import type { ReactNode } from "react";
import { useAdminVirtualizer } from "@/hooks/useAdminVirtualizer";

type VirtualAdminListProps<T> = {
  items: T[];
  estimateItemHeight: number;
  getItemKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage: string;
  resetKey?: string | number;
  heightClassName?: string;
};

export function VirtualAdminList<T>({
  items,
  estimateItemHeight,
  getItemKey,
  renderItem,
  emptyMessage,
  resetKey,
  heightClassName = "h-[720px]",
}: VirtualAdminListProps<T>) {
  const { containerRef, totalSize, virtualItems } = useAdminVirtualizer({
    items,
    estimateSize: estimateItemHeight,
    getItemKey,
    resetKey,
  });

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
        <p className="text-slate-500 dark:text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-y-auto pr-2 ${heightClassName}`}>
      <div className="relative" style={{ height: totalSize }}>
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            className="absolute left-0 top-0 w-full pr-2"
            style={{
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(virtualItem.item, virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
