import { cn } from "@/lib/cn";
import type { ComponentPropsWithRef, ReactNode } from "react";

type RadioCardProps = ComponentPropsWithRef<"input"> & {
  title: string;
  hint?: string;
  /** Right-aligned slot (e.g. a price) */
  right?: ReactNode;
};

/**
 * Full-width card radio. The native input stays in the tree (sr-only) so
 * keyboard and screen-reader behavior is free; the card styles react via
 * :has(:checked) / :has(:disabled).
 */
export function RadioCard({
  title,
  hint,
  right,
  className,
  ...props
}: RadioCardProps) {
  return (
    <label
      className={cn(
        "group relative flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border border-line-strong bg-white px-4 py-3",
        "transition-[border-color,background-color] duration-[180ms] ease-soft",
        "has-checked:border-primary has-checked:bg-primary-tint",
        "has-disabled:cursor-not-allowed has-disabled:opacity-50",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
        className,
      )}
    >
      {/* Explicit name: the wrapping label also holds the hint and price,
          so relying on its text content gives a muddled announcement. */}
      {/* Invisible but full-size: the input's own hit area is the whole card,
          so pointer targets stay ≥44px instead of collapsing to a 1px box. */}
      <input
        type="radio"
        className="absolute inset-0 m-0 cursor-pointer appearance-none opacity-0"
        aria-label={hint ? `${title} — ${hint}` : title}
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-pill border border-line-strong bg-white",
          "transition-[border-color] duration-[180ms] ease-soft",
          "group-has-checked:border-primary",
        )}
      >
        <span className="size-2.5 scale-0 rounded-pill bg-primary transition-transform duration-[180ms] ease-soft group-has-checked:scale-100" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium text-ink">{title}</span>
        {hint && <span className="text-small text-muted">{hint}</span>}
      </span>
      {right && <span className="shrink-0 text-right font-medium">{right}</span>}
    </label>
  );
}
