"use client";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
};

export function EmptyState({
  icon = "📚",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-6">{description}</p>
      )}
      {action && (
        <a
          href={action.href}
          className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
