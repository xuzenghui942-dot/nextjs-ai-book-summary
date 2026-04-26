export default function AdminBooksLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded mr-3" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}