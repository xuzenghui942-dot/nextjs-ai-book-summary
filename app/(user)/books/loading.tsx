export default function BooksLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse" />
        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded mb-8 animate-pulse" />
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8 animate-pulse">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
              <div className="h-64 bg-slate-200 dark:bg-slate-700" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}