import { cn } from "@/lib/cn";
import { useId, type ComponentPropsWithRef } from "react";

type InputProps = ComponentPropsWithRef<"input"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-small font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-14 w-full rounded-md border border-line-strong bg-white px-4 text-[16px] text-ink",
          "placeholder:text-muted",
          "transition-[border-color] duration-[180ms] ease-soft",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          error && "border-danger",
          className,
        )}
        {...props}
      />
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
