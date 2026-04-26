export default function AdminReviewsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
                  ))}
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}