interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
}

export function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...searchParams, page: page.toString() });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      {currentPage > 1 ? (
        <a
          href={buildUrl(currentPage - 1)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Previous
        </a>
      ) : (
        <span className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed">
          Previous
        </span>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 dark:text-slate-600">
            ...
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            className="px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white"
          >
            {page}
          </span>
        ) : (
          <a
            key={page}
            href={buildUrl(page)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {page}
          </a>
        )
      )}

      {currentPage < totalPages ? (
        <a
          href={buildUrl(currentPage + 1)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Next
        </a>
      ) : (
        <span className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed">
          Next
        </span>
      )}
    </div>
  );
}