import { cn } from "@/lib/cn";
import { t } from "@/config/copy.fr";

function Stars({ filled }: { filled: boolean }) {
  return (
    <span aria-hidden="true" className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className="size-4"
          viewBox="0 0 24 24"
          fill={filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinejoin="round"
            d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9L12 3.5z"
          />
        </svg>
      ))}
    </span>
  );
}

/** 5 stars with fractional fill (overlay clipped to value/5). */
export function Rating({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className={cn("relative inline-flex text-primary", className)}
      role="img"
      aria-label={t("reviews.ratingLabel", { rating: String(value).replace(".", ",") })}
    >
      <Stars filled={false} />
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        <Stars filled={true} />
      </span>
    </span>
  );
}
