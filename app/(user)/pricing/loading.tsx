export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 animate-pulse">
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}