import { memo } from "react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"}>
          ★
        </span>
      ))}
      <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">({rating.toFixed(1)})</span>
    </div>
  );
}

export default memo(StarRating);