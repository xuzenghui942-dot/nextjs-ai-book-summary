export default function AdminUsersLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full mr-3" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}