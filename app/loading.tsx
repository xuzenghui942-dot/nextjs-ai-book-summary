export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <div className="space-y-3">
          <div className="mx-auto h-4 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mx-auto h-3 w-64 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
