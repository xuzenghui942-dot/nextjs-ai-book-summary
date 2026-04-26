"use client";

export default function AdminSubscriptionsError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center max-w-md mx-auto py-20">
      <div className="text-6xl mb-4">💳</div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Failed to load subscriptions</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">{error.message || "An error occurred. Please try again."}</p>
      <button onClick={reset} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">Try Again</button>
    </div>
  );
}