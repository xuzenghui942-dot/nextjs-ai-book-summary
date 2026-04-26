export default function AdminSubscriptionsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}