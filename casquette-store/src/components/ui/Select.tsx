import { cn } from "@/lib/cn";
import { useId, type ComponentPropsWithRef } from "react";

type SelectProps = ComponentPropsWithRef<"select"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Select({
  label,
  error,
  hint,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={selectId} className="text-small font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-14 w-full appearance-none rounded-md border border-line-strong bg-white px-4 pr-11 text-[16px] text-ink",
            "transition-[border-color] duration-[180ms] ease-soft",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            "disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted",
            "invalid:text-muted", // placeholder option styling
            error && "border-danger",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
