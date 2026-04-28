"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-white">
          <div className="max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950 text-2xl text-rose-300">
              !
            </div>
            <h1 className="text-2xl font-bold">BookWise hit a critical error</h1>
            <p className="mt-3 text-slate-400">
              The app shell failed to render. Retry once before restarting the dev server.
            </p>
            <button
              onClick={reset}
              className="mt-6 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
