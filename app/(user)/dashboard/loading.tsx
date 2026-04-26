export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse" />
        <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 animate-pulse">
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl mb-6" />
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          </div>
          <div className="lg:col-span-2 animate-pulse">
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}