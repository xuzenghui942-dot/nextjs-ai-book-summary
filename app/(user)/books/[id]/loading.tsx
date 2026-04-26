export default function BookDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 animate-pulse">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}