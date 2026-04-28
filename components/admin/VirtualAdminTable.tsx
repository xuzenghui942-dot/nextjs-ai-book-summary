"use client";

import type { ReactNode } from "react";
import { useAdminVirtualizer } from "@/hooks/useAdminVirtualizer";

type VirtualAdminTableColumn = {
  key: string;
  label: string;
  className?: string;
};

type VirtualAdminTableProps<T> = {
  items: T[];
  columns: VirtualAdminTableColumn[];
  gridTemplateColumns: string;
  estimateRowHeight: number;
  getItemKey: (item: T, index: number) => string | number;
  renderRow: (item: T, index: number) => ReactNode;
  emptyMessage: string;
  resetKey?: string | number;
  minWidth?: string;
  heightClassName?: string;
};

export function VirtualAdminTable<T>({
  items,
  columns,
  gridTemplateColumns,
  estimateRowHeight,
  getItemKey,
  renderRow,
  emptyMessage,
  resetKey,
  minWidth = "900px",
  heightClassName = "h-[640px]",
}: VirtualAdminTableProps<T>) {
  const { containerRef, totalSize, virtualItems } = useAdminVirtualizer({
    items,
    estimateSize: estimateRowHeight,
    getItemKey,
    resetKey,
  });

  return (
    <div className="max-w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          <div
            role="row"
            className="grid bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
            style={{ gridTemplateColumns }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                role="columnheader"
                className={`px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${column.className ?? ""}`}
              >
                {column.label}
              </div>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            <div
              ref={containerRef}
              className={`relative overflow-y-auto overflow-x-hidden ${heightClassName}`}
            >
              <div className="relative" style={{ height: totalSize }}>
                {virtualItems.map((virtualItem) => (
                  <div
                    key={virtualItem.key}
                    className="absolute left-0 top-0 w-full"
                    style={{
                      height: virtualItem.size,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {renderRow(virtualItem.item, virtualItem.index)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
