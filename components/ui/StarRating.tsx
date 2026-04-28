"use client";

type StarRatingProps = {
  value: number;
  interactive?: boolean;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (value: number) => void;
};

export function StarRating({
  value,
  interactive = false,
  showValue = false,
  size = "md",
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const starClass = filled
          ? "text-yellow-400"
          : "text-slate-300 dark:text-slate-600";

        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`transition-transform hover:scale-110 ${starClass} ${sizeClasses[size]}`}
          >
            ★
          </button>
        ) : (
          <span
            key={star}
            className={`${starClass} ${sizeClasses[size]}`}
          >
            ★
          </span>
        );
      })}
      {showValue && (
        <span className={`text-slate-600 dark:text-slate-400 ml-1 ${textSizeClasses[size]}`}>
          ({value.toFixed(1)})
        </span>
      )}
    </div>
  );
}
